import { useState } from 'react';
export function Ring({ pct, size = 120, stroke = 8, color = "#34d399", bg = `var(--card-border)` }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s" }} />
    </svg>
  );
}

export function GlassCard({ children, style = {}, onClick, hover = true, selected }) {
  const [hov, setHov] = useState(false);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} aria-pressed={onClick ? selected : undefined} onClick={onClick}
      className={onClick ? "ui-card" : ""}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: hov ? `var(--card-bg-hover)` : `var(--card-bg)`,
        border: `1px solid ${hov ? `var(--card-border-hover)` : `var(--card-bg-hover)`}`,
        borderRadius: 16, backdropFilter: "blur(20px)",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        boxShadow: hov && onClick ? "0 10px 30px -12px rgba(0,0,0,0.5)" : "none",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left", fontFamily: "inherit", color: "var(--text)",
        ...style,
      }}>
      {children}
    </Tag>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: 4,
      background: `var(--card-bg)`,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, backdropFilter: "blur(20px)",
    }}>
      {tabs.map(t => (
        <button type="button" aria-pressed={active === t.id} key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "10px 0", border: "none",
          borderRadius: 10, cursor: "pointer",
          background: active === t.id ? `var(--line-strong)` : "transparent",
          color: active === t.id ? "var(--text)" : `var(--text-dark)`,
          fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
          transform: active === t.id ? "translateY(-1px)" : "none",
        }}>
          <span style={{ fontSize: 16, animation: active === t.id ? "floaty 2.5s ease-in-out infinite" : "none" }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub, color = "#fff" }) {
  return (
    <GlassCard hover={false} style={{ padding: "16px 14px" }}>
      <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: `var(--text-dark)`, marginTop: 4 }}>{sub}</div>}
    </GlassCard>
  );
}
