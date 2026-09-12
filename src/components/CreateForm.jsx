import { useState } from 'react';
import { validateCreation } from '../services/helpers';
import { originalText, getHabits, DURATIONS, AMOUNTS } from '../ui/originalCopy';
import { GlassCard } from '../ui/Primitives';
export default function CreateForm({ t: messages, vault, disabled = false, onCreate, lang = 'en' }) {
  const t = originalText(lang);
  const isTxDisabled = disabled || !vault;
  const btnText = messages.create;
  const [error, setError] = useState(null);
  const [previewStart] = useState(() => Date.now());
  const [step, setStep] = useState(0);
  const [habit, setHabit] = useState(null);
  const [isCustomHabit, setIsCustomHabit] = useState(false);
  const [customHabitLabel, setCustomHabitLabel] = useState("");
  const [customHabitSub, setCustomHabitSub] = useState("");
  const [duration, setDuration] = useState("30");
  const [amount, setAmount] = useState("10");
  const [charity, setCharity] = useState("");

  const sel = isCustomHabit ? { id: "custom", icon: "✨", label: customHabitLabel || t("customWrite"), sub: customHabitSub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habit);

  const form = { name: sel?.label || '', details: sel?.sub || '', duration, amount, penalty: charity };
  function valid() {
    try { validateCreation(form, vault); setError(null); return true; }
    catch (e) { setError(e.message); return false; }
  }
  const stepLabels = [t("sumHabit"), t("duration"), t("stakeAmount"), t("confirmTitle")];

  return (
    <section aria-label={messages.newCommitment}>
    <fieldset disabled={disabled} style={{ border: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {stepLabels.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < stepLabels.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div aria-current={i === step ? "step" : undefined} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < step ? "#34d399" : i === step ? "rgba(52,211,153,0.2)" : `var(--card-border)`,
                border: `1px solid ${i <= step ? "#34d399" : `var(--line-strong)`}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: i < step ? "#06060e" : i === step ? "#34d399" : `var(--text-darker)`,
                fontFamily: "'DM Mono', monospace", fontWeight: 500,
                transition: "all 0.3s",
              }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontSize: 9, color: i === step ? `var(--text-muted)` : `var(--text-darker)`, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? "#34d39940" : "rgba(255,255,255,0.06)", margin: "0 8px", marginBottom: 16, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 - habit */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("chooseHabit")}</div>
          <div className="mobile-grid-2" style={{ gap: 8 }}>
            {getHabits(t).map(h => (
              <GlassCard key={h.id} selected={!isCustomHabit && habit === h.id} onClick={() => { setHabit(h.id); setIsCustomHabit(false); }} style={{
                padding: "14px 16px",
                border: `1px solid ${!isCustomHabit && habit === h.id ? h.color + "60" : `var(--card-bg-hover)`}`,
                background: !isCustomHabit && habit === h.id ? h.color + "12" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 18, marginBottom: 6, color: h.color }}>{h.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: !isCustomHabit && habit === h.id ? h.color : `var(--text)`, marginBottom: 2 }}>{h.label}</div>
                <div style={{ fontSize: 10, color: `var(--text-darker)` }}>{h.sub}</div>
              </GlassCard>
            ))}
            <GlassCard selected={isCustomHabit} onClick={() => { setHabit("custom"); setIsCustomHabit(true); }} style={{
                padding: "14px 16px",
                border: `1px solid ${isCustomHabit ? "#fcd34d" + "60" : `var(--card-bg-hover)`}`,
                background: isCustomHabit ? "#fcd34d" + "12" : `var(--card-bg)`,
            }}>
                <div style={{ fontSize: 18, marginBottom: 6, color: "#fcd34d" }}>✨</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: isCustomHabit ? "#fcd34d" : `var(--text)`, marginBottom: 2 }}>{t("customWrite")}</div>
                <div style={{ fontSize: 10, color: `var(--text-darker)` }}>{t("customDest")}</div>
            </GlassCard>
          </div>

          {isCustomHabit && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("habitName")}</div>
              <input aria-label={messages.name} maxLength={80} type="text" placeholder={t("habitNamePH")} value={customHabitLabel} onChange={e => setCustomHabitLabel(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 12, outline: "none" }} />
              <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("habitTarget")}</div>
              <input aria-label={messages.details} maxLength={300} type="text" placeholder={t("habitTargetPH")} value={customHabitSub} onChange={e => setCustomHabitSub(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
            </div>
          )}

          <button disabled={!habit || (isCustomHabit && !customHabitLabel.trim())} onClick={() => setStep(1)} className="ui-btn" style={{
            marginTop: 16, width: "100%", padding: "14px", border: "none", borderRadius: 12,
            background: habit && (!isCustomHabit || customHabitLabel) ? "#34d399" : `var(--card-border)`,
            color: habit && (!isCustomHabit || customHabitLabel) ? "#06060e" : `var(--text-darker)`,
            fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em",
            cursor: habit && (!isCustomHabit || customHabitLabel) ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>{t("next")}</button>
        </div>
      )}

      {/* Step 1 - duration */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("duration")}</div>
          <div className="mobile-grid-3" style={{ gap: 8, marginBottom: 16 }}>
            {DURATIONS.map(d => (
              <GlassCard key={d} selected={Number(duration) === d} onClick={() => setDuration(String(d))} style={{
                padding: "14px 8px", textAlign: "center",
                border: `1px solid ${Number(duration) === d ? "#34d399" : `var(--card-bg-hover)`}`,
                background: Number(duration) === d ? "rgba(52,211,153,0.1)" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 18, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: Number(duration) === d ? "#34d399" : `var(--text-muted)` }}>{d}</div>
                <div style={{ fontSize: 9, color: `var(--text-darker)`, letterSpacing: "0.06em" }}>{t("days")}</div>
              </GlassCard>
            ))}
          </div>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
             <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("customDuration")}</div>
             <input aria-label={messages.duration} type="number" min="1" max="365" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
          </div>
          <GlassCard hover={false} style={{ padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: `var(--text-dark)` }}>{t("endDate")}</span>
              <span style={{ fontSize: 12, color: "#34d399", fontFamily: "'DM Mono', monospace" }}>
                ≈ {new Date(previewStart + Math.min(365, Math.max(0, Number(duration) || 0)) * 86400000).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </GlassCard>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(0)} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t("back")}</button>
            <button disabled={!/^[0-9]+$/.test(duration) || Number(duration) < 1 || Number(duration) > 365} onClick={() => setStep(2)} className="ui-btn" style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: duration > 0 ? "#34d399" : `var(--line-strong)`, color: duration > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: duration > 0 ? "pointer" : "not-allowed" }}>{t("next")}</button>
          </div>
        </div>
      )}

      {/* Step 2 - amount */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("stakeAmount")}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {AMOUNTS.map(a => (
              <GlassCard key={a} selected={amount === String(a)} onClick={() => setAmount(String(a))} style={{
                padding: "12px 16px", flex: 1, textAlign: "center", minWidth: 60,
                border: `1px solid ${amount === String(a) ? "#a78bfa" : `var(--card-bg-hover)`}`,
                background: amount === String(a) ? "rgba(167,139,250,0.1)" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'Syne', sans-serif", color: amount === String(a) ? "#a78bfa" : `var(--text-muted)` }}>${a}</div>
              </GlassCard>
            ))}
          </div>

          <div style={{ marginTop: 8, marginBottom: 16 }}>
             <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("customAmount")}</div>
             <input aria-label={messages.amount} type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
          </div>

          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("penaltyTitle")}</div>
          <input
            type="text"
            aria-label={messages.penalty} placeholder={t("penaltyPH")}
            value={charity}
            onChange={(e) => setCharity(e.target.value)}
            style={{ width: "100%", padding: "14px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 16, outline: "none" }}
          />

          <GlassCard hover={false} style={{ padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 12 }}>{t("summary")}</div>
            {[
              [t("sumHabit"), sel?.label],
              [t("duration"), `${duration} ${t("days").toLowerCase()}`],
              [t("sumStake"), `$${amount} USDC`],
              [t("sumSuccess"), t("sumSuccessDest")],
              [t("sumFail"), charity ? `${charity.slice(0,6)}... ${t("sumFailDest")}` : t("sumFailDef")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: `var(--text-dark)` }}>{k}</span>
                <span style={{ fontSize: 11, color: `var(--text-muted)`, fontFamily: "'DM Mono', monospace" }}>{v}</span>
              </div>
            ))}
          </GlassCard>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t("back")}</button>
            <button onClick={() => { if (valid()) setStep(3); }} disabled={!charity || !amount || Number(amount) <= 0} className="ui-btn" style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: charity && amount > 0 ? "#a78bfa" : `var(--line-strong)`, color: charity && amount > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: charity && amount > 0 ? "pointer" : "not-allowed" }}>{t("next")}</button>
          </div>
        </div>
      )}

      {/* Step 3 - confirm */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("confirmTitle")}</div>
          <GlassCard hover={false} style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8, color: sel?.color }}>{sel?.icon}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: `var(--text)`, marginBottom: 4 }}>{sel?.label}</div>
            <div style={{ fontSize: 11, color: `var(--text-dark)`, marginBottom: 20 }}>{sel?.sub}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#34d399" }}>{duration}</div>
                <div style={{ fontSize: 9, color: `var(--text-dark)`, letterSpacing: "0.08em" }}>{t("days")}</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#a78bfa" }}>${amount}</div>
                <div style={{ fontSize: 9, color: `var(--text-dark)`, letterSpacing: "0.08em" }}>USDC</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f472b6" }}>80%</div>
                <div style={{ fontSize: 9, color: `var(--text-dark)`, letterSpacing: "0.08em" }}>{t("threshold")}</div>
              </div>
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 10, fontSize: 11, color: "rgba(52,211,153,0.7)", lineHeight: 1.6 }}>
              {messages.threshold}
            </div>
          </GlassCard>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(2)} disabled={disabled} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t("back")}</button>
            <button onClick={() => { if (!isTxDisabled && valid()) void onCreate(form); }} disabled={isTxDisabled} className={`ui-btn ${isTxDisabled ? "" : "ui-gradient"}`} style={{ flex: 1, padding: "14px", border: "none", borderRadius: 10, background: isTxDisabled ? "var(--line-strong)" : undefined, color: isTxDisabled ? `var(--text-dark)` : "#06060e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: isTxDisabled ? "not-allowed" : "pointer", letterSpacing: "0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {disabled && <span className="ui-spinner" />} {btnText}
            </button>
          </div>
        </div>
      )}
    </fieldset>
    {error && <p className="notice danger" role="alert">{messages[error]}</p>}
    </section>
  );
}
