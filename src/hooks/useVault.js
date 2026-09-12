import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useConfig, usePublicClient } from 'wagmi';
import { getAccount, getWalletClient } from 'wagmi/actions';
import { createCommitment, loadCommitments, loadHistory, updateCommitment } from '../services/vault';
import { commitmentKey, sameAddress, saveMetadata } from '../services/helpers';

export function useVault(network) {
  const config = useConfig();
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient({ chainId: network.chain.id });
  const key = `${network.chain.id}:${network.vault}:${network.deploymentBlock}:${address?.toLowerCase() || ''}`;
  const [snapshot, setSnapshot] = useState(null);
  const [activity, setActivity] = useState(null);
  const [locked, setLocked] = useState(false);
  const lock = useRef(false);
  const request = useRef(0);
  const identity = useRef(0);
  const historyCache = useRef(null);
  const reading = useRef(false);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    if (!network.vault || !address || !client) return;
    reading.current = true;
    const ctx = { ...network, account: address };
    setSnapshot(previous => ({ ...(previous?.key === key ? previous : {}), key, loading: true, error: null }));
    try {
      const data = await loadCommitments(client, ctx);
      if (version !== request.current) return;
      setSnapshot({ ...data, key, loading: false, historyState: 'loading' });
      try {
        const cached = historyCache.current;
        // One bounded batch per manual/60-second refresh, including unchanged totals.
        // Completed scans request only new blocks, not the deployment-to-head range.
        const scan = data.commitments.length ? await loadHistory(client, ctx, data.blockNumber, { previous: cached?.key === key ? cached.scan : undefined, isCurrent: () => version === request.current }) : { history: {}, complete: true };
        if (version === request.current) {
          historyCache.current = { key, scan };
          setSnapshot(previous => ({ ...previous, history: scan.history, historyProgress: scan.nextBlock, historyState: scan.complete ? 'ready' : 'partial' }));
        }
      } catch {
        if (version === request.current) setSnapshot(previous => ({ ...previous, historyState: 'unavailable' }));
      }
    } catch (error) {
      if (version === request.current) setSnapshot(previous => ({ ...previous, key, loading: false, error }));
    } finally {
      if (version === request.current) reading.current = false;
    }
  }, [address, client, key, network]);
  useEffect(() => {
    // Deferred to avoid a synchronous effect-driven render; cleanup invalidates all RPC responses.
    const timer = setTimeout(() => { void refresh(); }, 0);
    const interval = setInterval(() => { if (!reading.current) void refresh(); }, 60000);
    const requestCounter = request;
    const identityCounter = identity;
    return () => { clearTimeout(timer); clearInterval(interval); requestCounter.current++; identityCounter.current++; };
  }, [refresh]);

  const transact = async (kind, input) => {
    if (lock.current) return false;
    lock.current = true; // Synchronous lock before any approval or await.
    setLocked(true);
    const ctx = Object.freeze({ ...network, account: address });
    const operationIdentity = identity.current;
    const current = () => {
      const account = getAccount(config);
      return identity.current === operationIdentity && account.isConnected && sameAddress(account.address, ctx.account) && account.chainId === ctx.chain.id;
    };
    const onStage = (stage, hash) => setActivity({ key, stage, hash, chain: ctx.chain });
    try {
      if (!ctx.vault) throw new Error('setup');
      if (!isConnected || !address) throw new Error('connectFirst');
      if (chainId !== ctx.chain.id) throw new Error('wrongNetwork');
      onStage('preparing');
      const wallet = await getWalletClient(config, { chainId: ctx.chain.id, account: ctx.account });
      const guard = async () => {
        if (!current() || await wallet.getChainId() !== ctx.chain.id || !(await wallet.getAddresses()).some(a => sameAddress(a, ctx.account))) throw new Error('accountChanged');
      };
      await guard();
      const result = kind === 'create'
        ? await createCommitment(client, wallet, ctx, input, onStage, guard)
        : await updateCommitment(client, wallet, ctx, kind, input, onStage, guard);
      let metadataSaved = true;
      if (kind === 'create') metadataSaved = saveMetadata(commitmentKey(ctx.chain.id, ctx.vault, result.id), result.metadata);
      // Confirmed result remains associated with the original operation, never the newly selected account/chain.
      setActivity({ key, stage: 'confirmed', hash: result.receipt.transactionHash, chain: ctx.chain, metadataSaved });
      if (current()) void refresh();
      return true;
    } catch (error) {
      setActivity(previous => ({ ...(previous?.key === key ? previous : {}), key, stage: 'error', error, chain: ctx.chain }));
      return false;
    } finally {
      lock.current = false;
      setLocked(false);
    }
  };
  return { address, connected: isConnected, wrongNetwork: isConnected && chainId !== network.chain.id, data: snapshot?.key === key ? snapshot : null, activity: activity?.key === key ? activity : null, locked, refresh, transact };
}
