import { describe, expect, it, vi } from 'vitest';
import { encodeEventTopics, encodeAbiParameters, parseAbiParameters } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import abi from '../abi/CommitmentVault.json';
import { createCommitment, loadHistory, updateCommitment } from './vault';
const vault = '0x1111111111111111111111111111111111111111';
const account = '0x2222222222222222222222222222222222222222';
const penalty = '0x3333333333333333333333333333333333333333';
const token = '0x4444444444444444444444444444444444444444';
const ctx = { vault, account, chain: baseSepolia, deploymentBlock: 10n };
const form = { name: 'Read', amount: '5', duration: '7', penalty };
const creationLog = { address: vault, topics: encodeEventTopics({ abi, eventName: 'CommitmentCreated', args: { id: 0n, owner: account } }), data: encodeAbiParameters(parseAbiParameters('uint256,uint256,address'), [5000000n, 7n, penalty]) };
function clients() {
  let allowed = false;
  const client = {
    readContract: vi.fn(async ({ functionName }) => ({ REQUIRED_THRESHOLD: 80n, MAX_DURATION_DAYS: 365n, usdc: token, decimals: 6, balanceOf: 10000000n, allowance: allowed ? 5000000n : 0n, getCommitment: { finalized: true } })[functionName]),
    simulateContract: vi.fn(async request => ({ request })),
    waitForTransactionReceipt: vi.fn(async ({ hash }) => {
      allowed = true;
      return { transactionHash: hash, status: 'success', blockNumber: 20n, logs: hash === '0xcreate' ? [creationLog] : [] };
    }),
  };
  const wallet = { writeContract: vi.fn(async request => request.functionName === 'approve' ? '0xapprove' : '0xcreate') };
  return { client, wallet };
}
describe('transaction service', () => {
  it('validates before any approval, read, or wallet request', async () => {
    const { client, wallet } = clients();
    await expect(createCommitment(client, wallet, ctx, { ...form, duration: '366' }, vi.fn(), vi.fn())).rejects.toThrow('invalidDuration');
    expect(client.readContract).not.toHaveBeenCalled();
    expect(wallet.writeContract).not.toHaveBeenCalled();
  });
  it('waits for approval receipt then creation receipt, returning exact event id zero', async () => {
    const { client, wallet } = clients();
    const result = await createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn());
    expect(result.id).toBe(0n);
    expect(client.waitForTransactionReceipt.mock.calls.map(([r]) => r.hash)).toEqual(['0xapprove', '0xcreate']);
    expect(wallet.writeContract.mock.calls.map(([r]) => [r.functionName, r.chain.id, r.account])).toEqual([['approve', 84532, account], ['createCommitment', 84532, account]]);
    expect(wallet.writeContract.mock.calls[1][0].args).toEqual([5000000n, 7n, penalty, 80n]);
  });
  it('uses the confirmed approval block when latest RPC state is stale', async () => {
    const { client, wallet } = clients();
    const read = client.readContract.getMockImplementation();
    client.readContract.mockImplementation(async request => request.functionName === 'allowance'
      ? (request.blockNumber === 20n ? 5000000n : 0n) : read(request));
    client.simulateContract.mockImplementation(async request => {
      if (request.functionName === 'createCommitment' && request.blockNumber !== 20n) throw Error('stale simulation');
      return { request };
    });
    const result = await createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn());
    expect(result.id).toBe(0n);
    expect(client.readContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'allowance', blockNumber: 20n, args: [account, vault] }));
    expect(wallet.writeContract).toHaveBeenCalledTimes(2);
  });
  it('reuses sufficient existing approval without asking for another approval', async () => {
    const { client, wallet } = clients();
    const read = client.readContract.getMockImplementation();
    client.readContract.mockImplementation(async request => request.functionName === 'allowance' ? 5000000n : read(request));
    await createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn());
    expect(wallet.writeContract.mock.calls.map(([r]) => r.functionName)).toEqual(['createCommitment']);
  });
  it('still blocks creation when the confirmed-block allowance is insufficient', async () => {
    const { client, wallet } = clients();
    const read = client.readContract.getMockImplementation();
    client.readContract.mockImplementation(async request => request.functionName === 'allowance' ? 0n : read(request));
    await expect(createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn())).rejects.toThrow('approvalFailed');
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
  });
  it('never sends create after reverted approval', async () => {
    const { client, wallet } = clients();
    client.waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' });
    await expect(createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn())).rejects.toThrow('reverted');
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
  });
  it('stops after approval if account changes', async () => {
    const { client, wallet } = clients();
    const guard = vi.fn(async () => { if (client.waitForTransactionReceipt.mock.calls.length) throw Error('accountChanged'); });
    await expect(createCommitment(client, wallet, ctx, form, vi.fn(), guard)).rejects.toThrow('accountChanged');
    expect(wallet.writeContract).toHaveBeenCalledTimes(1);
  });
  it('rejects incompatible vault policy before approval', async () => {
    const { client, wallet } = clients();
    client.readContract.mockResolvedValue(90n);
    await expect(createCommitment(client, wallet, ctx, form, vi.fn(), vi.fn())).rejects.toThrow('unsupportedVault');
    expect(wallet.writeContract).not.toHaveBeenCalled();
  });
  it('re-reads finalized state at the successful receipt block', async () => {
    const { client, wallet } = clients();
    const result = await updateCommitment(client, wallet, ctx, 'finalize', 0n, vi.fn(), vi.fn());
    expect(result.commitment.finalized).toBe(true);
    expect(client.readContract).toHaveBeenLastCalledWith(expect.objectContaining({ functionName: 'getCommitment', blockNumber: 20n, args: [0n] }));
  });
});
describe('bounded real event history', () => {
  it('paginates inclusive ranges and derives timestamps from log blocks', async () => {
    const client = { getLogs: vi.fn(async query => query.event.name === 'CheckinRecorded' && query.fromBlock === 10n ? [{ address: vault, eventName: 'CheckinRecorded', args: { id: 0n, owner: account, checkins: 1n }, blockNumber: 11n, transactionHash: '0xactual', logIndex: 0 }] : []), getBlock: vi.fn().mockResolvedValue({ timestamp: 123456n }) };
    const { history } = await loadHistory(client, ctx, 14n, { pageSize: 2n });
    expect(client.getLogs.mock.calls.map(([q]) => [q.fromBlock, q.toBlock])).toEqual([[10n, 11n], [10n, 11n], [12n, 13n], [12n, 13n], [14n, 14n], [14n, 14n]]);
    expect(history['0'].checkins).toEqual([{ timestamp: 123456n, hash: '0xactual', logIndex: 0 }]);
    expect(client.getBlock).toHaveBeenCalledWith({ blockNumber: 11n });
  });
  it('accepts old deployments with bounded work and resumes until complete', async () => {
    const client = { getLogs: vi.fn().mockResolvedValue([]) };
    let scan = await loadHistory(client, ctx, 510010n);
    expect(scan).toMatchObject({ complete: false, nextBlock: 10010n });
    expect(client.getLogs).toHaveBeenCalledTimes(10);
    client.getLogs.mockClear();
    scan = await loadHistory(client, ctx, 510010n, { previous: scan });
    expect(client.getLogs.mock.calls[0][0].fromBlock).toBe(10010n);
    expect(scan.nextBlock).toBe(20010n);
    for (let batch = 0; batch < 50; batch++) scan = await loadHistory(client, ctx, 510010n, { previous: scan });
    expect(scan.complete).toBe(true);
    expect(scan.nextBlock).toBe(510011n);
    expect(client.getLogs.mock.calls.every(([q]) => q.toBlock - q.fromBlock < 2000n && q.toBlock <= 510010n)).toBe(true);
    client.getLogs.mockClear();
    scan = await loadHistory(client, ctx, 510012n, { previous: scan });
    expect(client.getLogs.mock.calls.map(([q]) => [q.fromBlock, q.toBlock])).toEqual([[510011n, 510012n], [510011n, 510012n]]);
    expect(scan.complete).toBe(true);
  });
  it('honors a smaller batch budget and cancels between RPC calls', async () => {
    const client = { getLogs: vi.fn().mockResolvedValue([]) };
    const scan = await loadHistory(client, ctx, 100n, { pageSize: 2n, maxPages: 2 });
    expect(scan.nextBlock).toBe(14n);
    expect(client.getLogs).toHaveBeenCalledTimes(4);
    client.getLogs.mockClear();
    await expect(loadHistory(client, ctx, 100n, { isCurrent: () => client.getLogs.mock.calls.length === 0 })).rejects.toThrow('staleRequest');
    expect(client.getLogs).toHaveBeenCalledTimes(1);
  });
  it('deduplicates logs, preserves checkpoints, and scopes continuation to account/network', async () => {
    const event = { address: vault, eventName: 'CheckinRecorded', args: { id: 0n, owner: account }, blockNumber: 10n, transactionHash: '0xactual', logIndex: 0 };
    const client = { getLogs: vi.fn(async q => q.event.name === 'CheckinRecorded' && q.fromBlock === 10n ? [event, event] : []), getBlock: vi.fn().mockResolvedValue({ timestamp: 123n }) };
    const first = await loadHistory(client, ctx, 10n);
    expect(first.history['0'].checkins).toHaveLength(1);
    expect(client.getBlock).toHaveBeenCalledTimes(1);
    const next = await loadHistory(client, ctx, 12n, { previous: first });
    expect(next.history['0'].checkins).toHaveLength(1);
    expect(first.nextBlock).toBe(11n);
    expect(next.nextBlock).toBe(13n);
    for (const switched of [{ ...ctx, account: penalty }, { ...ctx, chain: { id: 8453 } }]) {
      client.getLogs.mockClear();
      await loadHistory(client, switched, 12n, { previous: next });
      expect(client.getLogs.mock.calls[0][0].fromBlock).toBe(10n);
    }
  });
  it.each([{ pageSize: 2001n }, { pageSize: 0n }, { maxPages: 6 }, { maxPages: 0 }])('rejects unsafe page options without RPC: %o', async options => {
    const client = { getLogs: vi.fn() };
    await expect(loadHistory(client, ctx, 100n, options)).rejects.toThrow('historyUnavailable');
    expect(client.getLogs).not.toHaveBeenCalled();
  });
  it('stops obsolete account history work', async () => {
    const client = { getLogs: vi.fn() };
    await expect(loadHistory(client, ctx, 10n, { isCurrent: () => false })).rejects.toThrow('staleRequest');
    expect(client.getLogs).not.toHaveBeenCalled();
  });
});
