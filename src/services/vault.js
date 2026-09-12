import { decodeEventLog, erc20Abi } from 'viem';
import abi from '../abi/CommitmentVault.json';
import { sameAddress, validateCreation } from './helpers';

const call = (ctx, functionName, args = []) => ({ address: ctx.vault, abi, functionName, args });
export async function confirmedReceipt(client, hash) {
  let cancelled = false;
  const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 1, onReplaced: ({ reason }) => { if (reason === 'cancelled' || reason === 'replaced') cancelled = true; } });
  if (cancelled) throw new Error('transactionReplaced');
  if (receipt.status !== 'success') throw new Error('reverted');
  return receipt;
}
export function createdId(receipt, ctx) {
  const matches = [];
  for (const log of receipt.logs) {
    if (!sameAddress(log.address, ctx.vault)) continue;
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics, strict: true });
      if (event.eventName === 'CommitmentCreated' && sameAddress(event.args.owner, ctx.account)) matches.push(event.args.id);
    } catch { /* Unrelated or malformed logs are not creation evidence. */ }
  }
  if (matches.length !== 1) throw new Error('missingCreationEvent');
  return matches[0];
}
export async function loadCommitments(client, ctx) {
  const block = await client.getBlock();
  const ids = await client.readContract({ ...call(ctx, 'getUserCommitments', [ctx.account]), blockNumber: block.number });
  const commitments = [];
  for (let offset = 0; offset < ids.length; offset += 5) {
    const batch = await Promise.all(ids.slice(offset, offset + 5).map(async id => {
      const c = await client.readContract({ ...call(ctx, 'getCommitment', [id]), blockNumber: block.number });
      if (!sameAddress(c.owner, ctx.account)) throw new Error('ownerMismatch');
      return { ...c, id, success: c.finalized ? c.checkins * 100n / c.durationDays >= c.threshold : null };
    }));
    commitments.push(...batch);
  }
  return { commitments: commitments.reverse(), blockNumber: block.number, now: block.timestamp };
}
// At most five 2,000-block pages per refresh; age never disables history.
// Retain the returned checkpoint to continue without rescanning completed pages.
export async function loadHistory(client, ctx, toBlock, { pageSize = 2000n, maxPages = 5, previous, isCurrent = () => true } = {}) {
  if (typeof ctx.deploymentBlock !== 'bigint' || ctx.deploymentBlock < 0n || ctx.deploymentBlock > toBlock) throw new Error('historyUnavailable');
  if (typeof pageSize !== 'bigint' || pageSize <= 0n || pageSize > 2000n || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) throw new Error('historyUnavailable');
  const scope = `${ctx.chain?.id}:${ctx.vault.toLowerCase()}:${ctx.account.toLowerCase()}:${ctx.deploymentBlock}`;
  const cached = previous?.scope === scope && previous.nextBlock <= toBlock + 1n ? previous : null;
  const history = Object.fromEntries(Object.entries(cached?.history || {}).map(([id, value]) => [id, { ...value, checkins: [...value.checkins] }]));
  const seen = new Set(cached?.seen || []);
  const blocks = new Map();
  let nextBlock = cached?.nextBlock ?? ctx.deploymentBlock;
  const guard = () => { if (!isCurrent()) throw new Error('staleRequest'); };
  guard();
  for (let page = 0; page < maxPages && nextBlock <= toBlock; page++) {
    const end = nextBlock + pageSize - 1n < toBlock ? nextBlock + pageSize - 1n : toBlock;
    const logs = [];
    for (const name of ['CheckinRecorded', 'CommitmentFinalized']) {
      guard();
      logs.push(...await client.getLogs({ address: ctx.vault, event: abi.find(e => e.type === 'event' && e.name === name), ...(name === 'CheckinRecorded' ? { args: { owner: ctx.account } } : {}), fromBlock: nextBlock, toBlock: end, strict: true }));
      guard();
    }
    for (const log of logs) {
      guard();
      if (log.removed || !sameAddress(log.address, ctx.vault) || log.blockNumber < nextBlock || log.blockNumber > end) continue;
      if (log.eventName === 'CheckinRecorded' && !sameAddress(log.args.owner, ctx.account)) continue;
      const eventKey = `${log.blockHash ?? log.blockNumber}:${log.transactionHash}:${log.logIndex}`;
      if (seen.has(eventKey)) continue;
      const id = log.args.id.toString();
      history[id] ??= { checkins: [], settlement: null };
      if (log.eventName === 'CheckinRecorded') {
        if (!blocks.has(log.blockNumber)) {
          blocks.set(log.blockNumber, await client.getBlock({ blockNumber: log.blockNumber }));
          guard();
        }
        history[id].checkins.push({ timestamp: blocks.get(log.blockNumber).timestamp, hash: log.transactionHash, logIndex: log.logIndex });
      } else if (log.eventName === 'CommitmentFinalized') history[id].settlement = { ...log.args, hash: log.transactionHash };
      seen.add(eventKey);
    }
    nextBlock = end + 1n;
  }
  guard();
  return { scope, history, seen, nextBlock, complete: nextBlock > toBlock };
}
async function send(client, wallet, ctx, request, onStage, guard, blockNumber) {
  await guard();
  const { request: simulated } = await client.simulateContract({ ...request, account: ctx.account, ...(blockNumber === undefined ? {} : { blockNumber }) });
  await guard();
  onStage('wallet');
  const hash = await wallet.writeContract({ ...simulated, account: ctx.account, chain: ctx.chain });
  onStage('confirming', hash);
  const receipt = await confirmedReceipt(client, hash);
  return receipt;
}
export async function createCommitment(client, wallet, ctx, form, onStage, guard) {
  const value = validateCreation(form, ctx.vault); // Before even reading allowance.
  await guard();
  const [threshold, maxDuration] = await Promise.all([
    client.readContract(call(ctx, 'REQUIRED_THRESHOLD')),
    client.readContract(call(ctx, 'MAX_DURATION_DAYS')),
  ]);
  if (threshold !== 80n || maxDuration !== 365n) throw new Error('unsupportedVault');
  const token = await client.readContract(call(ctx, 'usdc'));
  const [decimals, balance, allowance] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' }),
    client.readContract({ address: token, abi: erc20Abi, functionName: 'balanceOf', args: [ctx.account] }),
    client.readContract({ address: token, abi: erc20Abi, functionName: 'allowance', args: [ctx.account, ctx.vault] }),
  ]);
  if (decimals !== 6) throw new Error('unsupportedToken');
  if (balance < value.amount) throw new Error('insufficientBalance');
  let approvalBlock;
  if (allowance < value.amount) {
    onStage('approval');
    const approvalReceipt = await send(client, wallet, ctx, { address: token, abi: erc20Abi, functionName: 'approve', args: [ctx.vault, value.amount] }, (stage, hash) => onStage(stage === 'wallet' ? 'approval' : 'approvalConfirming', hash), guard);
    await guard();
    // Latest-state RPC caches can lag behind a successful receipt. Read and
    // simulate against the confirmed block, not the pre-approval latest state.
    approvalBlock = approvalReceipt.blockNumber;
    const approved = await client.readContract({ address: token, abi: erc20Abi, functionName: 'allowance', args: [ctx.account, ctx.vault], blockNumber: approvalBlock });
    if (approved < value.amount) throw new Error('approvalFailed');
  }
  const receipt = await send(client, wallet, ctx, call(ctx, 'createCommitment', [value.amount, value.durationDays, value.penalty, 80n]), onStage, guard, approvalBlock);
  const id = createdId(receipt, ctx);
  return { id, receipt, metadata: value };
}
export async function updateCommitment(client, wallet, ctx, kind, id, onStage, guard) {
  if (!['checkin', 'finalize'].includes(kind)) throw new Error('invalidAction');
  const receipt = await send(client, wallet, ctx, call(ctx, kind, [id]), onStage, guard);
  const commitment = await client.readContract({ ...call(ctx, 'getCommitment', [id]), blockNumber: receipt.blockNumber });
  if (kind === 'finalize' && !commitment.finalized) throw new Error('notFinalized');
  return { id, receipt, commitment };
}
