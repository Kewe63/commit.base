import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baseSepolia } from 'wagmi/chains';
const state = vi.hoisted(() => ({ account: null, config: {}, client: {}, wallet: {}, load: vi.fn(), history: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock('wagmi', () => ({ useAccount: () => state.account, useConfig: () => state.config, usePublicClient: () => state.client }));
vi.mock('wagmi/actions', () => ({ getAccount: () => state.account, getWalletClient: async () => state.wallet }));
vi.mock('../services/vault', () => ({ loadCommitments: (...args) => state.load(...args), loadHistory: (...args) => state.history(...args), createCommitment: (...args) => state.create(...args), updateCommitment: (...args) => state.update(...args) }));
import { useVault } from './useVault';
const address = '0x2222222222222222222222222222222222222222';
const other = '0x3333333333333333333333333333333333333333';
const network = { chain: baseSepolia, vault: '0x1111111111111111111111111111111111111111', deploymentBlock: 0n };
const snapshot = { commitments: [], now: 100000n, blockNumber: 1n };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
beforeEach(() => {
  vi.clearAllMocks();
  state.account = { address, isConnected: true, chainId: baseSepolia.id };
  state.wallet = { getChainId: async () => baseSepolia.id, getAddresses: async () => [state.account.address] };
  state.load.mockResolvedValue(snapshot);
  state.history.mockResolvedValue({ history: {}, complete: true, nextBlock: 2n });
});
afterEach(cleanup);
describe('incremental history refresh', () => {
  it('resumes partial scans even when commitment totals do not change', async () => {
    state.load.mockResolvedValue({ ...snapshot, commitments: [{ id: 0n, checkins: 1n, finalized: true }] });
    const partial = { history: {}, complete: false, nextBlock: 10000n };
    state.history.mockResolvedValueOnce(partial).mockResolvedValue({ history: {}, complete: true, nextBlock: 20000n });
    const { result } = renderHook(() => useVault(network));
    await waitFor(() => expect(result.current.data?.historyState).toBe('partial'));
    expect(result.current.data.historyProgress).toBe(10000n);
    await act(async () => { await result.current.refresh(); });
    expect(state.history.mock.calls[1][3].previous).toBe(partial);
    expect(result.current.data.historyState).toBe('ready');
  });
  it('passes the checkpoint after a confirmed transaction changes totals', async () => {
    state.load.mockResolvedValue({ ...snapshot, commitments: [{ id: 0n, checkins: 1n, finalized: false }] });
    const scan = { history: {}, complete: true, nextBlock: 2n };
    state.history.mockResolvedValue(scan);
    state.update.mockResolvedValue({ receipt: { transactionHash: '0xconfirmed' } });
    const { result } = renderHook(() => useVault(network));
    await waitFor(() => expect(result.current.data?.historyState).toBe('ready'));
    state.load.mockResolvedValue({ ...snapshot, blockNumber: 3n, commitments: [{ id: 0n, checkins: 2n, finalized: false }] });
    await act(async () => { await result.current.transact('checkin', 0n); });
    await waitFor(() => expect(state.history).toHaveBeenCalledTimes(2));
    expect(state.history.mock.calls[1][3].previous).toBe(scan);
  });
  it('invalidates pending history and never shares cursors on account/network switches', async () => {
    state.load.mockResolvedValue({ ...snapshot, commitments: [{ id: 0n, checkins: 1n, finalized: true }] });
    const pending = deferred();
    state.history.mockReturnValueOnce(pending.promise).mockResolvedValue({ history: {}, complete: true, nextBlock: 2n });
    const { result, rerender } = renderHook(({ selected }) => useVault(selected), { initialProps: { selected: network } });
    await waitFor(() => expect(state.history).toHaveBeenCalledTimes(1));
    const oldGuard = state.history.mock.calls[0][3].isCurrent;
    state.account = { ...state.account, address: other };
    rerender({ selected: network });
    await waitFor(() => expect(result.current.data?.historyState).toBe('ready'));
    expect(oldGuard()).toBe(false);
    expect(state.history.mock.calls[1][3].previous).toBeUndefined();
    await act(async () => { pending.resolve({ history: { old: {} }, complete: false, nextBlock: 10n }); });
    expect(result.current.data.history).toEqual({});
    rerender({ selected: { ...network, chain: { ...baseSepolia, id: 8453 } } });
    await waitFor(() => expect(state.history).toHaveBeenCalledTimes(3));
    expect(state.history.mock.calls[2][3].previous).toBeUndefined();
  });
  it('retains chain settlement data on history failure and retries the saved cursor', async () => {
    state.load.mockResolvedValue({ ...snapshot, commitments: [{ id: 0n, checkins: 1n, finalized: true }] });
    const partial = { history: {}, complete: false, nextBlock: 10000n };
    state.history.mockResolvedValueOnce(partial).mockRejectedValueOnce(Error('rpc')).mockResolvedValue(partial);
    const { result } = renderHook(() => useVault(network));
    await waitFor(() => expect(result.current.data?.historyState).toBe('partial'));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.data.commitments[0].finalized).toBe(true);
    expect(result.current.data.error).toBeFalsy();
    expect(result.current.data.historyState).toBe('unavailable');
    await act(async () => { await result.current.refresh(); });
    expect(state.history.mock.calls[2][3].previous).toBe(partial);
  });
});
describe('transaction-wide UI lock and stale response isolation', () => {
  it('locks synchronously across the whole service call, including approval', async () => {
    const pending = deferred();
    state.create.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useVault(network));
    await waitFor(() => expect(result.current.data?.now).toBe(100000n));
    let first;
    await act(async () => {
      first = result.current.transact('create', {});
      expect(await result.current.transact('create', {})).toBe(false);
    });
    expect(result.current.locked).toBe(true);
    expect(state.create).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve({ id: 0n, metadata: { name: 'Read', details: '' }, receipt: { transactionHash: '0xreal' } });
      await first;
    });
    expect(result.current.locked).toBe(false);
    expect(result.current.activity.stage).toBe('confirmed');
  });
  it('does not show old account receipt or invoke old-account refresh after a switch', async () => {
    const pending = deferred();
    state.create.mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(() => useVault(network));
    await waitFor(() => expect(result.current.data?.now).toBe(100000n));
    let transaction;
    await act(async () => { transaction = result.current.transact('create', {}); });
    state.account = { ...state.account, address: other };
    rerender();
    await waitFor(() => expect(state.load).toHaveBeenLastCalledWith(state.client, expect.objectContaining({ account: other })));
    const readsBefore = state.load.mock.calls.length;
    await act(async () => { pending.resolve({ id: 0n, metadata: { name: 'Read' }, receipt: { transactionHash: '0xold' } }); await transaction; });
    expect(result.current.activity).toBeNull();
    expect(state.load).toHaveBeenCalledTimes(readsBefore);
  });
  it('ignores delayed chain restore from the previous account', async () => {
    const pending = deferred();
    state.load.mockImplementation((_, ctx) => ctx.account === address ? pending.promise : Promise.resolve({ ...snapshot, now: 200000n }));
    const { result, rerender } = renderHook(() => useVault(network));
    await waitFor(() => expect(state.load).toHaveBeenCalled());
    state.account = { ...state.account, address: other };
    rerender();
    await waitFor(() => expect(result.current.data?.now).toBe(200000n));
    await act(async () => { pending.resolve(snapshot); });
    expect(result.current.data.now).toBe(200000n);
  });
});
