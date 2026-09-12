export default function TransactionStatus({ activity, locked, t }) {
  if (!activity && !locked) return null;
  const error = activity?.error;
  return <aside className={`notice ${error ? 'danger' : ''}`} role={error ? 'alert' : 'status'} aria-live="polite">
    {locked && <p>{t.busy}</p>}
    {activity && <p>{t[activity.stage] || t.error}</p>}
    {error && <p>{t[error.message] || t.error}</p>}
    {error && !t[error.message] && <details><summary>{t.technical}</summary><p className="address">{error.shortMessage || error.message}</p></details>}
    {activity?.hash && <a target="_blank" rel="noreferrer" href={`${activity.chain.blockExplorers.default.url}/tx/${activity.hash}`}>{t.viewTransaction} ↗</a>}
    {activity?.metadataSaved === false && <p>{t.metadataFailed}</p>}
  </aside>;
}
