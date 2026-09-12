import { useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useState } from 'react';
export default function WalletControls({ address, connected, wrongNetwork, network, locked, t }) {
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const run = async action => { setError(null); try { await action(); setOpen(false); } catch (e) { setError(e); } };
  return <div className="wallet-controls">
    {connected ? <button type="button" className="connected-pill" aria-label={t.disconnect} title={t.disconnect} disabled={locked} onClick={() => disconnect()}>{address?.slice(0, 6)}…{address?.slice(-4)}</button> : <button type="button" aria-expanded={open} disabled={locked || isPending} onClick={() => connectors.length === 1 ? run(() => connectAsync({ connector: connectors[0], chainId: network.chain.id })) : setOpen(!open)}>{t.connect.startsWith('Cüzdan') ? 'Bağlan' : 'Connect'}</button>}
    {open && <div className="wallet-menu">{connectors.length ? connectors.map(connector => <button type="button" key={connector.uid} disabled={locked || isPending} onClick={() => run(() => connectAsync({ connector, chainId: network.chain.id }))}>{connector.name}</button>) : <p>{t.noWallet}</p>}</div>}
    {wrongNetwork && <button type="button" disabled={locked} onClick={() => run(() => switchChainAsync({ chainId: network.chain.id }))}>{t.switchNetwork}</button>}
    {error && <p className="wallet-menu danger" role="alert">{t.error} <span>{error.shortMessage || error.message}</span></p>}
  </div>;
}
