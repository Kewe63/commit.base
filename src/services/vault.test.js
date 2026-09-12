import { describe, it, expect, vi } from 'vitest';
import { encodeEventTopics, encodeAbiParameters, parseAbiParameters } from 'viem';
import { validateCreation, commitmentKey, readMetadata, historyStats } from './helpers';
import { confirmedReceipt, createdId, loadCommitments, loadHistory } from './vault';
import abi from '../abi/CommitmentVault.json';
const vault = '0x1111111111111111111111111111111111111111';
const owner = '0x2222222222222222222222222222222222222222';
const penalty = '0x3333333333333333333333333333333333333333';
const form = { amount: '1.25', duration: '7', penalty, name: 'Read', details: '' };
describe('creation validation', () => {
  it('parses exact USDC units', () => expect(validateCreation(form, vault).amount).toBe(1250000n));
  it.each(['0', '-1', '1e4', '0.0000001', '1.1234567'])('rejects unsafe amount %s', amount => expect(() => validateCreation({ ...form, amount }, vault)).toThrow());
  it.each(['0', '366', '1.5', '7e0'])('rejects invalid duration %s', duration => expect(() => validateCreation({ ...form, duration }, vault)).toThrow());
  it('rejects vault as penalty recipient', () => expect(() => validateCreation({ ...form, penalty: vault }, vault)).toThrow());
});
describe('metadata and actual history', () => {
  it('normalizes compound keys', () => expect(commitmentKey(84532, vault.toUpperCase(), 1n)).toBe(`84532:${vault}:1`));
  it('tolerates corrupt and inaccessible storage', () => {
    expect(readMetadata('x', { getItem: () => '{bad' })).toEqual({});
    expect(readMetadata('x', { getItem: () => { throw Error(); } })).toEqual({});
  });
  it('never accepts financial metadata', () => expect(readMetadata('x', { getItem: () => '{"name":"Read","amount":99,"finalized":true}' })).toEqual({ name: 'Read' }));
  it('derives dates and streak only from actual timestamps', () => {
    expect(historyStats([{ timestamp: 86400n }, { timestamp: 172800n }, { timestamp: 345600n }], 345600n)).toEqual({ dates: ['1970-01-02', '1970-01-03', '1970-01-05'], streak: 1 });
  });
});
describe('receipts and chain restore', () => {
  it('rejects reverted receipts', async () => {
    await expect(confirmedReceipt({ waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'reverted' }) }, '0x123')).rejects.toThrow('reverted');
  });
  it('requires exact vault and owner event without guessed fallback', () => {
    const log = { address: vault, topics: encodeEventTopics({ abi, eventName: 'CommitmentCreated', args: { id: 0n, owner } }), data: encodeAbiParameters(parseAbiParameters('uint256,uint256,address'), [1250000n, 7n, penalty]) };
    expect(createdId({ logs: [log] }, { vault, account: owner })).toBe(0n);
    expect(() => createdId({ logs: [{ ...log, address: penalty }] }, { vault, account: owner })).toThrow();
    expect(() => createdId({ logs: [log] }, { vault, account: penalty })).toThrow();
    expect(() => createdId({ logs: [] }, { vault, account: owner })).toThrow();
  });
  it('restores finalized commitments without localStorage', async () => {
    const client = { getBlock: vi.fn().mockResolvedValue({ number: 20n, timestamp: 1000n }), readContract: vi.fn(({ functionName }) => Promise.resolve(functionName === 'getUserCommitments' ? [0n] : { owner, finalized: true, checkins: 7n, durationDays: 7n, threshold: 80n })) };
    const result = await loadCommitments(client, { vault, account: owner });
    expect(result.commitments[0]).toMatchObject({ id: 0n, finalized: true, success: true });
  });
  it('does not query unbounded history without deployment block', async () => {
    const client = { getLogs: vi.fn() };
    await expect(loadHistory(client, { vault, account: owner, deploymentBlock: null }, 100n)).rejects.toThrow('historyUnavailable');
    expect(client.getLogs).not.toHaveBeenCalled();
  });
});
