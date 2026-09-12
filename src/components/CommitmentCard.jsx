import { formatUnits } from 'viem';
import { commitmentKey, dateTime, DAY, historyStats, lifecycle, readMetadata } from '../services/helpers';
import { GlassCard, Ring, StatCard } from '../ui/Primitives';
import { getHabits, originalText } from '../ui/originalCopy';

export default function CommitmentCard({ commitment: c, network, now, history, historyState, locked, wrongNetwork, onAction, lang, t, tab = 'active' }) {
  const metadata = readMetadata(commitmentKey(network.chain.id, network.vault, c.id));
  const state = lifecycle(c, now);
  const historyComplete = historyState === 'ready' && BigInt(history?.checkins.length || 0) === c.checkins;
  const stats = historyComplete ? historyStats(history?.checkins || [], now) : null;
  const status = c.finalized ? (c.success ? t.refunded : t.paidPenalty) : state.canFinalize ? t.ready : t.active;
  const explorer = network.chain.blockExplorers.default.url;
  const original = originalText(lang);
  const habit = [...getHabits(originalText('tr')), ...getHabits(originalText('en'))].find(h => h.label === metadata.name);
  const color = habit?.color || '#fcd34d';
  const amount = formatUnits(c.amount, 6);
  const duration = Number(c.durationDays);
  const count = Number(c.checkins);
  const rate = duration ? count / duration : 0;
  const remaining = Math.max(0, Math.ceil(Number(state.deadline - now) / Number(DAY)));
  const addressLink = address => <a href={`${explorer}/address/${address}`} title={address} target="_blank" rel="noreferrer">{address.slice(0, 6)}…{address.slice(-4)} ↗</a>;
  const historyNotice = historyState === 'loading' ? t.historyLoading : historyState === 'partial' ? t.historyPartial : t.historyUnavailable;
  const deadline = <p className="small">{t.deadline}: <time dateTime={new Date(Number(state.deadline) * 1000).toISOString()}>{dateTime(state.deadline, lang)}</time></p>;
  const eventHistory = <details className="event-history"><summary>{t.history}</summary>
    {!historyComplete ? <p role={historyState === 'loading' ? 'status' : undefined}>{historyNotice}</p> : <>
      <p>{t.streak}: <strong>{stats.streak} {t.days}</strong></p>
      {!stats.dates.length ? <p>{t.noCheckins}</p> : <ul className="history-list">{history.checkins.map((event, index) => <li key={`${event.hash}-${event.logIndex ?? index}`}><a href={`${explorer}/tx/${event.hash}`} target="_blank" rel="noreferrer">{dateTime(event.timestamp, lang)} ↗</a></li>)}</ul>}
    </>}
    {history?.settlement && <a href={`${explorer}/tx/${history.settlement.hash}`} target="_blank" rel="noreferrer">{t.settlement} ↗</a>}
  </details>;
  return <article className="commitment" style={{ '--habit-color': color }}>
    <div className="habit-pill" style={{ background: `${color}12`, borderColor: `${color}30` }}><span style={{ color }} aria-hidden="true">{habit?.icon || '✨'}</span><h3>{metadata.name || `${t.fallbackName} #${c.id}`}</h3>{metadata.details && <span className="habit-detail">{metadata.details}</span>}<span className="habit-total">{duration}{t.days} · ${amount}</span></div>
    {tab === 'active' && <>
      <GlassCard hover={false} style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="eyebrow">{c.finalized ? t.finalizedAmount : original('activeCommit')}</div>
        <div className="ring-wrap" role="img" aria-label={`${t.checkins}: ${count} / ${duration}`}>
          <div className={state.canCheckin && !locked ? 'ui-pulse ring-glow' : 'ring-glow'} />
          <Ring pct={Math.min(1, rate)} size={180} stroke={12} color={color} />
          <div className="ring-value"><strong>{count}</strong><span>/ {duration} {original('days')}</span></div>
        </div>
        {!c.finalized && <div className="actions">
          <button type="button" className="checkin-button ui-btn" disabled={locked || wrongNetwork || !state.canCheckin} onClick={() => onAction('checkin', c.id)}>{t.checkin}</button>
          <button type="button" className="finalize-button ui-btn ui-gradient" disabled={locked || wrongNetwork || !state.canFinalize} onClick={() => onAction('finalize', c.id)}>{t.finalize}</button>
        </div>}
        <span className={`badge ${c.finalized ? 'settled' : ''}`}>{status}</span>
        {!c.finalized && !state.canFinalize && !state.canCheckin && <p className="muted small">{c.checkins >= c.durationDays ? t.endWait : `${t.nextCheckin}: ${dateTime(c.lastCheckinTime + DAY, lang)}`}</p>}
      </GlassCard>
      <div className="mobile-grid-3" style={{ gap: 10 }}>
        <StatCard label={original('completed')} value={count} sub={t.days} color={color} />
        <StatCard label={original('remaining')} value={remaining} sub={t.days} color="var(--text-muted)" />
        <StatCard label={original('successRate')} value={`${Math.round(rate * 100)}%`} sub={original('rateStr')} color={rate >= 0.8 ? '#34d399' : '#f87171'} />
      </div>
      <GlassCard hover={false} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div><div className="eyebrow">{c.finalized ? t.finalizedAmount : 'STAKE'}</div><div className="stake-value">${amount} USDC</div></div>
        <div className="network-stat"><div className="eyebrow">NETWORK</div><span className="ui-dot" />{network.chain.name}</div>
      </GlassCard>
      {deadline}{eventHistory}
    </>}
    {tab === 'calendar' && <>
      <GlassCard hover={false} style={{ padding: 20 }}><div className="eyebrow">{original('calendarTitle')} · UTC</div>
        {!historyComplete ? <p className="muted small">{historyNotice}</p> : <Calendar c={c} deadline={state.deadline} dates={stats.dates} lang={lang} color={color} />}
      </GlassCard>
      <div className="mobile-grid-2" style={{ gap: 10 }}>
        <StatCard label={t.streak} value={stats ? stats.streak : '—'} sub={t.days} color="#f472b6" />
        <StatCard label={original('completion')} value={`${Math.round(rate * 100)}%`} sub={original('completedText')} color="#60a5fa" />
      </div>{deadline}{eventHistory}
    </>}
    {tab === 'contract' && <>
      <GlassCard hover={false} style={{ padding: 18 }}><div className="eyebrow">{original('contractInfo')}</div>
        <dl className="contract-rows">{[
          [t.vault, addressLink(network.vault)],
          ...(network.usdc ? [['USDC', addressLink(network.usdc)]] : []),
          [t.network, network.chain.name],
          [c.finalized ? t.finalizedAmount : t.stake, `$${amount} USDC`],
          [original('successThresh'), '80%'],
          [t.penalty, addressLink(c.penaltyAddress)],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{deadline}
      </GlassCard>
      <GlassCard hover={false} style={{ padding: 18 }}><div className="contract-status"><span className="eyebrow">{original('stakeStatus')}</span><span>{status}</span></div>
        <progress aria-label={t.checkins} max={duration} value={count} /><div className="progress-labels"><span>0%</span><span>{t.threshold}</span><span>100%</span></div>
      </GlassCard>
      <GlassCard hover={false} style={{ padding: 18 }}><div className="eyebrow">{original('onchainTx')}</div>{eventHistory}</GlassCard>
    </>}
  </article>;
}

function Calendar({ c, deadline, dates, lang, color }) {
  const firstDay = c.startTime / DAY;
  const lastDay = (deadline - 1n) / DAY;
  const firstDate = new Date(Number(firstDay * DAY) * 1000);
  const offset = (firstDate.getUTCDay() + 6) % 7;
  const days = Array.from({ length: Number(lastDay - firstDay + 1n) }, (_, i) => new Date(Number((firstDay + BigInt(i)) * DAY) * 1000));
  return <><div className="calendar-range">{firstDate.toLocaleDateString(lang, { timeZone: 'UTC', month: 'long', year: 'numeric' })}</div>
    <div className="calendar-grid">{originalText(lang)('weekDays').map(day => <span className="weekday" key={day}>{day}</span>)}
      {Array.from({ length: offset }, (_, i) => <span key={`pad-${i}`} />)}
      {days.map(date => {
        const key = date.toISOString().slice(0, 10);
        const done = dates.includes(key);
        return <time key={key} dateTime={key} title={`${key}${done ? ' ✓' : ''}`} aria-label={`${key}${done ? ' ✓' : ''}`} className="calendar-day" style={done ? { background: `${color}30`, borderColor: `${color}60`, color } : {}}>{done ? '✓' : date.getUTCDate()}<small>{date.getUTCMonth() + 1}/{date.getUTCDate()}</small></time>;
      })}
    </div></>;
}
