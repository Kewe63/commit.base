import { useEffect, useState } from 'react';
import { networks } from './config';
import { messages } from './i18n';
import { useVault } from './hooks/useVault';
import CreateForm from './components/CreateForm';
import CommitmentCard from './components/CommitmentCard';
import TransactionStatus from './components/TransactionStatus';
import WalletControls from './components/WalletControls';
import InteractiveBG from './ui/InteractiveBG';
import { GlassCard, TabBar } from './ui/Primitives';
import { originalText } from './ui/originalCopy';
import './App.css';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('dark');
  const [selectedChain, setSelectedChain] = useState(networks[0].chain.id);
  const [screen, setScreen] = useState('setup');
  const [tab, setTab] = useState('active');
  const network = networks.find(n => n.chain.id === selectedChain);
  const vault = useVault(network);
  const t = messages[lang];
  const original = originalText(lang);
  const data = vault.data;
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dataset.theme = theme; }, [lang, theme]);
  const tabs = [
    { id: 'active', icon: <i className="bx bx-pulse" aria-hidden="true" />, label: original('tabActive') },
    { id: 'calendar', icon: <i className="bx bx-calendar" aria-hidden="true" />, label: original('tabCalendar') },
    { id: 'contract', icon: <i className="bx bx-receipt" aria-hidden="true" />, label: original('tabContract') },
  ];
  return <div className="app-shell" data-theme={theme}>
    <InteractiveBG theme={theme} />
    <a className="skip-link" href="#main">{lang === 'tr' ? 'İçeriğe geç' : 'Skip to content'}</a>
    <div className="app-content">
      <header className="topbar">
        <div className="header-row">
          <a className="brand" href="#main"><div className="brand-title"><span className="logo-loader" aria-hidden="true" /><span>commit<span className="base-blue">.base</span></span></div><small>{original('appSubtitle')}</small></a>
          <div className="preferences">
            <select aria-label={t.network} value={selectedChain} disabled={vault.locked} onChange={e => setSelectedChain(Number(e.target.value))}>{networks.map(n => <option key={n.chain.id} value={n.chain.id}>{n.chain.name}</option>)}</select>
            <button type="button" className="theme-toggle" aria-label={t.theme} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><i className="bx bxs-sun bg-icon sun" aria-hidden="true" /><i className="bx bxs-moon bg-icon moon" aria-hidden="true" /><span className="knob"><i className={theme === 'dark' ? 'bx bxs-moon' : 'bx bxs-sun'} aria-hidden="true" /></span></button>
            <button type="button" className="language-pill" aria-label={t.language} onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}>{lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}</button>
            <WalletControls {...vault} network={network} t={t} />
          </div>
        </div>
        {vault.connected && <nav className="screen-nav" aria-label={t.dashboard}>
          <button type="button" aria-pressed={screen === 'dashboard'} onClick={() => setScreen('dashboard')}>{original('dashboard')}</button>
          <button type="button" aria-pressed={screen === 'setup'} onClick={() => setScreen('setup')}>{original('addNew')}</button>
        </nav>}
        <div className="header-rule" />
      </header>
      <main id="main">
        {vault.wrongNetwork && <p className="notice" role="status">{t.wrongNetwork}</p>}
        <TransactionStatus activity={vault.activity} locked={vault.locked} t={t} />
        {screen === 'setup' ? <GlassCard hover={false} style={{ padding: 24 }}>
          <div className="create-intro"><h1>{original('createTitle')}</h1><p>{original('createDesc')}</p></div>
          <CreateForm t={t} lang={lang} vault={network.vault} disabled={vault.locked} onCreate={async form => { if (await vault.transact('create', form)) setScreen('dashboard'); }} />
        </GlassCard> : <section aria-label={t.dashboard}>
          <div className="dashboard-tools"><span>{t.dashboard}</span><button type="button" disabled={!vault.connected || !network.vault || data?.loading || vault.locked} onClick={() => void vault.refresh()}>{t.refresh} ↻</button></div>
          {!vault.connected && <p className="panel muted">{t.explore}</p>}
          {data?.loading && <p role="status">{t.loading}</p>}
          {data?.error && <p className="notice danger" role="alert">{t.loadError}</p>}
          {data && !data.loading && !data.error && data.commitments?.length === 0 && <p className="panel muted">{t.empty}</p>}
          {Boolean(data?.commitments?.length) && <div className="dashboard-tabs"><TabBar tabs={tabs} active={tab} onChange={setTab} /></div>}
          {data?.commitments?.map(commitment => <CommitmentCard key={commitment.id.toString()} tab={tab} commitment={commitment} network={network} now={data.now} history={data.history?.[commitment.id.toString()]} historyState={data.historyState} locked={vault.locked || Boolean(data.error)} wrongNetwork={vault.wrongNetwork} onAction={vault.transact} lang={lang} t={t} />)}
        </section>}
        <aside className="safety-notes">
          <p>{network.chain.testnet ? t.testnet : t.mainnet}</p>
          {!network.vault && <p role="status">{t.setup}</p>}
          <details className="policy"><summary>{t.threshold}</summary><p>{t.policy}</p><p>{t.deployment}</p><p>{t.localNote}</p>{network.vault && <p className="address">{t.vault}: <a href={`${network.chain.blockExplorers.default.url}/address/${network.vault}`} target="_blank" rel="noreferrer">{network.vault} ↗</a></p>}</details>
        </aside>
      </main>
    </div>
  </div>;
}
