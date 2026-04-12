import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { baseSepolia } from 'wagmi/chains';
import { parseUnits } from 'viem';

const TRANSLATIONS = {
  tr: {
    sport: "Spor", read: "Okuma", meditate: "Meditasyon", nosugar: "Şekersiz", code: "Kod", water: "Su",
    sportSub: "30 dk egzersiz", readSub: "20 sayfa kitap", meditateSub: "10 dk nefes", nosugarSub: "Sıfır şeker", codeSub: "1 saat geliştirme", waterSub: "2 litre/gün",
    chooseHabit: "ALIŞKANLIĞINI SEÇ", customWrite: "Kendin Yaz", customDest: "Özel alışkanlık",
    habitName: "ALIŞKANLIK ADI", habitNamePH: "Örn: Sabah Koşusu",
    habitTarget: "HEDEF / DETAY", habitTargetPH: "Örn: 5 km koş",
    duration: "SÜRE", days: "GÜN", customDuration: "VEYA ÖZEL SÜRE GİR (GÜN)", endDate: "bitiş tarihi",
    back: "← geri", next: "devam et →", stakeAmount: "STAKE MİKTARI", customAmount: "VEYA ÖZEL MİKTAR GİR (USDC)",
    penaltyTitle: "CEZA ADRESİ (BAŞARISIZLIK DURUMUNDA)", penaltyPH: "0x... (Cüzdan Adresi)", summary: "ÖZET", sumHabit: "Alışkanlık", sumDuration: "Süre", sumStake: "Stake", sumSuccess: "Başarı", sumSuccessDest: "%80 check-in → tam iade", sumFail: "Başarısızlık", sumFailDest: "adresine gider", sumFailDef: "Belirtilen adrese gider",
    confirmTitle: "TAAHHÜDÜ ONAYLA", threshold: "EŞİK", contractHint: "USDC akıllı kontrata kilitlenir. Günlük check-in ile onchain kanıt oluşturulur.", signStake: "kontratı imzala & stake et",
    activeCommit: "AKTİF TAAHHÜT", checkinNow: "bugün check-in", verifying: "x402 AI Doğrulanıyor...", successRefund: "🎉 başarı! iade yolda", failNoRefund: "⚠ iade eşiği aşılamadı",
    completed: "TAMAMLANAN", remaining: "KALAN", successRate: "BAŞARI", rateStr: "oran", network: "NETWORK", calendarTitle: "TAAHHÜT TAKVİMİ", currentStreak: "GÜNCEL SERİ", completion: "TAMAMLANMA", completedText: "tamamlandı",
    contractInfo: "KONTRAT BİLGİSİ", cAddress: "Kontrat adresi", agentWallet: "Ajan Cüzdan", successThresh: "Başarı eşiği", stakeStatus: "STAKE DURUMU", statusRefund: "iade edilecek", statusRisk: "risk altında",
    onchainTx: "ONCHAIN İŞLEMLER", txStart: "STAKE · Başlangıç", txWait: "Bekleniyor", txResult: "SONUÇ", txConfirmed: "✓ confirmed", txDonate: "Ceza Adresine Transfer", txSelf: "İade",
    appSubtitle: "ONCHAIN HABIT PROTOCOL", connectBtn: "Bağlan", dashboard: "Dashboard", addNew: "Yeni Ekle",
    createTitle: "Taahhüdünü oluştur", createDesc: "Alışkanlığını seç, USDC stake et. Başarırsan paranı geri al.", noActive: "Aktif taahhüdün yok. Hemen yeni bir alışkanlık oluştur.",
    tabActive: "aktif", tabCalendar: "takvim", tabContract: "kontrat", waitingWallet: "Cüzdan Onayı Bekleniyor...", verifyingBase: "Ağda Doğrulanıyor...", agentSaving: "Ajan Kaydediyor...", connectWallet: "Cüzdan Bağla",
    errConn: "Bağlantı hatası: Arka plan servisi (agent-backend) kapalı. Lütfen 'node server.js' komutu ile servisi başlatın.", errVal: "Doğrulama başarısız: "
  },
  en: {
    sport: "Sport", read: "Reading", meditate: "Meditate", nosugar: "No Sugar", code: "Coding", water: "Water",
    sportSub: "30 min exercise", readSub: "20 pges book", meditateSub: "10 min breathing", nosugarSub: "Zero sugar", codeSub: "1 hr dev", waterSub: "2 liters/day",
    chooseHabit: "CHOOSE HABIT", customWrite: "Custom Habit", customDest: "Write your own",
    habitName: "HABIT NAME", habitNamePH: "e.g., Morning Run", habitTarget: "GOAL / DETAILS", habitTargetPH: "e.g., Run 5 km",
    duration: "DURATION", days: "DAYS", customDuration: "OR ENTER CUSTOM DURATION (DAYS)", endDate: "end date",
    back: "← back", next: "continue →", stakeAmount: "STAKE AMOUNT", customAmount: "OR ENTER CUSTOM AMOUNT (USDC)",
    penaltyTitle: "PENALTY ADDRESS (ON FAILURE)", penaltyPH: "0x... (Wallet Address)", summary: "SUMMARY", sumHabit: "Habit", sumDuration: "Duration", sumStake: "Stake", sumSuccess: "Success", sumSuccessDest: "80% check-in → full refund", sumFail: "Failure", sumFailDest: "will receive", sumFailDef: "Sent to penalty address",
    confirmTitle: "CONFIRM COMMITMENT", threshold: "THRESHOLD", contractHint: "USDC locked in smart contract. Daily check-in creates onchain proof.", signStake: "sign contract & stake",
    activeCommit: "ACTIVE COMMITMENT", checkinNow: "check-in today", verifying: "x402 AI Verifying...", successRefund: "🎉 success! refund on way", failNoRefund: "⚠ refund threshold failed",
    completed: "COMPLETED", remaining: "REMAINING", successRate: "SUCCESS", rateStr: "rate", network: "NETWORK", calendarTitle: "COMMITMENT CALENDAR", currentStreak: "CURRENT STREAK", completion: "COMPLETION", completedText: "completed",
    contractInfo: "CONTRACT INFO", cAddress: "Contract address", agentWallet: "Agent Wallet", successThresh: "Success threshold", stakeStatus: "STAKE STATUS", statusRefund: "will refund", statusRisk: "at risk",
    onchainTx: "ONCHAIN TRANSACTIONS", txStart: "STAKE · Initiation", txWait: "Pending", txResult: "RESULT", txConfirmed: "✓ confirmed", txDonate: "Penalty Transfer", txSelf: "Refund",
    appSubtitle: "ONCHAIN HABIT PROTOCOL", connectBtn: "Connect", dashboard: "Dashboard", addNew: "New Target",
    createTitle: "Create your commitment", createDesc: "Select a habit, stake USDC. Get it back if you succeed.", noActive: "No active commitments. Create a new habit now.",
    tabActive: "active", tabCalendar: "calendar", tabContract: "contract", waitingWallet: "Waiting Wallet Approval...", verifyingBase: "Verifying on Base...", agentSaving: "Agent Saving...", connectWallet: "Connect Wallet",
    errConn: "Connection error: Background service (agent-backend) is offline. Please start it.", errVal: "Validation failed: "
  }
};
let currentLang = "tr";
const themeListeners = new Set();
function useGlobalState() {
  const [state, setState] = useState({ lang: currentLang });
  useEffect(() => {
    const fn = () => setState({ lang: currentLang });
    themeListeners.add(fn);
    return () => themeListeners.delete(fn);
  }, []);
  const t = (k) => TRANSLATIONS[state.lang][k] || k;
  return { t, lang: state.lang, theme: "dark" };
}
export function toggleLang() { currentLang = currentLang === "tr" ? "en" : "tr"; themeListeners.forEach(f => f()); }

const getHabits = (t) => [
  { id: "sport", icon: <i className="bx bx-dumbbell"></i>, label: t("sport"), sub: t("sportSub"), color: "#ff6b35" },
  { id: "read", icon: <i className="bx bx-book-open"></i>, label: t("read"), sub: t("readSub"), color: "#a78bfa" },
  { id: "meditate", icon: <i className="bx bx-spa"></i>, label: t("meditate"), sub: t("meditateSub"), color: "#38bdf8" },
  { id: "nosugar", icon: <i className="bx bx-shield"></i>, label: t("nosugar"), sub: t("nosugarSub"), color: "#34d399" },
  { id: "code", icon: <i className="bx bx-code-alt"></i>, label: t("code"), sub: t("codeSub"), color: "#f472b6" },
  { id: "water", icon: <i className="bx bx-water"></i>, label: t("water"), sub: t("waterSub"), color: "#60a5fa" },
];

const DURATIONS = [7, 14, 21, 30, 60, 90];
const AMOUNTS = [5, 10, 25, 50, 100];

// Define USDC Contract on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const AGENT_WALLET = "0x07da137f89BB72BFE7c5ccA87bac842fb9E6F58b";
const erc20Abi = [
  {
    "constant": false,
    "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const API_URL = "/api";
function InteractiveBG() {
  const { theme } = useGlobalState();
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const orbs = useRef([]);
  const frame = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    orbs.current = [
      { x: W * 0.2, y: H * 0.3, vx: 0.15, vy: 0.08, r: 320, color: "80,60,200" },
      { x: W * 0.7, y: H * 0.6, vx: -0.12, vy: 0.1, r: 280, color: "20,180,120" },
      { x: W * 0.5, y: H * 0.8, vx: 0.08, vy: -0.15, r: 260, color: "200,60,120" },
      { x: W * 0.85, y: H * 0.2, vx: -0.1, vy: 0.12, r: 240, color: "40,140,220" },
    ];

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#06060e";
      ctx.fillRect(0, 0, W, H);

      orbs.current.forEach((o, i) => {
        o.x += o.vx + (mouse.current.x - W / 2) * 0.00015 * (i % 2 === 0 ? 1 : -1);
        o.y += o.vy + (mouse.current.y - H / 2) * 0.00015 * (i % 2 === 0 ? -1 : 1);
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color},0.18)`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // grid noise
      ctx.strokeStyle = "rgba(255,255,255,0.018)";
      ctx.lineWidth = 0.5;
      const gStep = 60;
      for (let x = 0; x < W; x += gStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      frame.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

function Ring({ pct, size = 120, stroke = 8, color = "#34d399", bg = `var(--card-border)` }) {
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

function GlassCard({ children, style = {}, onClick, hover = true }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: hov ? `var(--card-bg-hover)` : `var(--card-bg)`,
        border: `1px solid ${hov ? `var(--card-border-hover)` : `var(--card-bg-hover)`}`,
        borderRadius: 16, backdropFilter: "blur(20px)",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}>
      {children}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: 4,
      background: `var(--card-bg)`,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, backdropFilter: "blur(20px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "10px 0", border: "none",
          borderRadius: 10, cursor: "pointer",
          background: active === t.id ? `var(--line-strong)` : "transparent",
          color: active === t.id ? "#fff" : `var(--text-dark)`,
          fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color = "#fff", icon }) {
  return (
    <GlassCard hover={false} style={{ padding: "16px 14px" }}>
      <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: `var(--text-dark)`, marginTop: 4 }}>{sub}</div>}
    </GlassCard>
  );
}

function SetupFlow({ onStart, btnText, isTxDisabled }) {
  const { t, theme } = useGlobalState();
  const [step, setStep] = useState(0);
  const [habit, setHabit] = useState(null);
  const [isCustomHabit, setIsCustomHabit] = useState(false);
  const [customHabitLabel, setCustomHabitLabel] = useState("");
  const [customHabitSub, setCustomHabitSub] = useState("");
  const [duration, setDuration] = useState(30);
  const [amount, setAmount] = useState(10);
  const [charity, setCharity] = useState("");

  const sel = isCustomHabit ? { id: "custom", icon: "✨", label: customHabitLabel || t("customWrite"), sub: customHabitSub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habit);

  const stepLabels = [t("sumHabit"), t("duration"), t("stakeAmount"), t("confirmTitle")];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {stepLabels.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < stepLabels.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
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
              <GlassCard key={h.id} onClick={() => { setHabit(h.id); setIsCustomHabit(false); }} style={{
                padding: "14px 16px",
                border: `1px solid ${!isCustomHabit && habit === h.id ? h.color + "60" : `var(--card-bg-hover)`}`,
                background: !isCustomHabit && habit === h.id ? h.color + "12" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 18, marginBottom: 6, color: h.color }}>{h.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: !isCustomHabit && habit === h.id ? h.color : `var(--text)`, marginBottom: 2 }}>{h.label}</div>
                <div style={{ fontSize: 10, color: `var(--text-darker)` }}>{h.sub}</div>
              </GlassCard>
            ))}
            <GlassCard onClick={() => { setHabit("custom"); setIsCustomHabit(true); }} style={{
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
              <input type="text" placeholder={t("habitNamePH")} value={customHabitLabel} onChange={e => setCustomHabitLabel(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 12, outline: "none" }} />
              <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("habitTarget")}</div>
              <input type="text" placeholder={t("habitTargetPH")} value={customHabitSub} onChange={e => setCustomHabitSub(e.target.value)} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
            </div>
          )}

          <button disabled={!habit || (isCustomHabit && !customHabitLabel)} onClick={() => setStep(1)} style={{
            marginTop: 16, width: "100%", padding: "14px", border: "none", borderRadius: 12,
            background: habit && (!isCustomHabit || customHabitLabel) ? "#34d399" : `var(--card-border)`,
            color: habit && (!isCustomHabit || customHabitLabel) ? "#06060e" : `var(--text-darker)`,
            fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em",
            cursor: habit && (!isCustomHabit || customHabitLabel) ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>devam et →</button>
        </div>
      )}

      {/* Step 1 - duration */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("duration")}</div>
          <div className="mobile-grid-3" style={{ gap: 8, marginBottom: 16 }}>
            {DURATIONS.map(d => (
              <GlassCard key={d} onClick={() => setDuration(d)} style={{
                padding: "14px 8px", textAlign: "center",
                border: `1px solid ${duration === d ? "#34d399" : `var(--card-bg-hover)`}`,
                background: duration === d ? "rgba(52,211,153,0.1)" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 18, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: duration === d ? "#34d399" : `var(--text-muted)` }}>{d}</div>
                <div style={{ fontSize: 9, color: `var(--text-darker)`, letterSpacing: "0.06em" }}>{t("days")}</div>
              </GlassCard>
            ))}
          </div>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
             <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("customDuration")}</div>
             <input type="number" min="1" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || "")} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
          </div>
          <GlassCard hover={false} style={{ padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: `var(--text-dark)` }}>{t("endDate")}</span>
              <span style={{ fontSize: 12, color: "#34d399", fontFamily: "'DM Mono', monospace" }}>
                {new Date(Date.now() + (duration || 0) * 86400000).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </GlassCard>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(0)} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>← geri</button>
            <button disabled={!duration || duration < 1} onClick={() => setStep(2)} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: duration > 0 ? "#34d399" : `var(--line-strong)`, color: duration > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: duration > 0 ? "pointer" : "not-allowed" }}>devam et →</button>
          </div>
        </div>
      )}

      {/* Step 2 - amount */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("stakeAmount")}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {AMOUNTS.map(a => (
              <GlassCard key={a} onClick={() => setAmount(a)} style={{
                padding: "12px 16px", flex: 1, textAlign: "center", minWidth: 60,
                border: `1px solid ${amount === a ? "#a78bfa" : `var(--card-bg-hover)`}`,
                background: amount === a ? "rgba(167,139,250,0.1)" : `var(--card-bg)`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'Syne', sans-serif", color: amount === a ? "#a78bfa" : `var(--text-muted)` }}>${a}</div>
              </GlassCard>
            ))}
          </div>

          <div style={{ marginTop: 8, marginBottom: 16 }}>
             <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 8 }}>{t("customAmount")}</div>
             <input type="number" min="1" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || "")} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
          </div>

          <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 14 }}>{t("penaltyTitle")}</div>
          <input 
            type="text" 
            placeholder={t("penaltyPH")} 
            value={charity} 
            onChange={(e) => setCharity(e.target.value)} 
            style={{ width: "100%", padding: "14px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 16, outline: "none" }} 
          />

          <GlassCard hover={false} style={{ padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 12 }}>{t("summary")}</div>
            {[
              [t("sumHabit"), `${sel?.icon} ${sel?.label}`],
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
            <button onClick={() => setStep(1)} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>← geri</button>
            <button onClick={() => setStep(3)} disabled={!charity || !amount || amount < 1} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: charity && amount > 0 ? "#a78bfa" : `var(--line-strong)`, color: charity && amount > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: charity && amount > 0 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>devam et →</button>
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
              {amount} {t("contractHint")}
            </div>
          </GlassCard>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(2)} disabled={isTxDisabled} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: `var(--text-dark)`, cursor: isTxDisabled ? "not-allowed" : "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>← geri</button>
            <button onClick={() => onStart({ habit, isCustomHabit, customHabitLabel, customHabitSub, duration, amount, charity })} disabled={isTxDisabled} style={{ flex: 1, padding: "14px", border: "none", borderRadius: 10, background: isTxDisabled ? `var(--line-strong)` : "linear-gradient(135deg,#34d399,#a78bfa)", color: isTxDisabled ? `var(--text-dark)` : "#06060e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: isTxDisabled ? "not-allowed" : "pointer", letterSpacing: "0.02em" }}>
              {btnText || t("signStake")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveTab({ comm, processingThis, onCheckin }) {
  const { t, theme } = useGlobalState();
  const { duration, amount, checkins, habitId, customHabit } = comm;
  const sel = habitId === "custom" ? { id: "custom", icon: "✨", label: customHabit?.label || t("customWrite"), sub: customHabit?.sub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habitId);
  const pct = duration ? checkins / duration : 0;
  const rate = pct;
  const isComplete = checkins >= duration;
  const daysLeft = Math.max(0, duration - checkins);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero ring */}
      <GlassCard hover={false} style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 11, color: `var(--text-dark)`, letterSpacing: "0.12em" }}>{t("activeCommit")}</div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ring pct={pct} size={180} stroke={12} color={sel?.color || "#34d399"} />
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: `var(--text)`, lineHeight: 1 }}>
              {checkins}
            </div>
            <div style={{ fontSize: 11, color: `var(--text-dark)`, letterSpacing: "0.06em" }}>/ {duration} {t("days")}</div>
          </div>
        </div>

        {/* Check-in button */}
        {!isComplete && (
          <button onClick={onCheckin} disabled={processingThis} style={{
            width: 200, padding: "14px 0",
            border: `1px solid ${processingThis ? "rgba(255,255,255,0.08)" : (sel?.color || "#34d399") + "80"}`,
            borderRadius: 50, cursor: processingThis ? "not-allowed" : "pointer",
            background: processingThis ? "rgba(255,255,255,0.03)" : `${sel?.color || "#34d399"}18`,
            color: processingThis ? `var(--text-darker)` : sel?.color || "#34d399",
            fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em",
            transition: "all 0.25s",
            textTransform: "uppercase"
          }}>
            {processingThis ? t("verifying") : t("checkinNow")}
          </button>
        )}

        {isComplete && (
          <div style={{ padding: "12px 24px", background: rate >= 0.8 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${rate >= 0.8 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: 50, fontSize: 12, color: rate >= 0.8 ? "#34d399" : "#f87171", letterSpacing: "0.08em" }}>
            {rate >= 0.8 ? t("successRefund") : t("failNoRefund")}
          </div>
        )}
      </GlassCard>

      {/* Stats row */}
      <div className="mobile-grid-3" style={{ gap: 10 }}>
        <StatCard label={t("completed")} value={checkins} sub={t("days").toLowerCase()} color={sel?.color} />
        <StatCard label={t("remaining")} value={daysLeft} sub={t("days").toLowerCase()} color="var(--text-muted)" />
        <StatCard label={t("successRate")} value={`${Math.round(rate * 100)}%`} sub={t("rateStr")} color={rate >= 0.8 ? "#34d399" : "#f87171"} />
      </div>

      {/* Stake card */}
      <GlassCard hover={false} style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 3 }}>STAKE</div>
          <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#a78bfa" }}>${amount} USDC</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 3 }}>NETWORK</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>Base Sepolia</div>
        </div>
      </GlassCard>
    </div>
  );
}

function CalendarTab({ comm }) {
  const { t, theme } = useGlobalState();
  const { duration, checkins, habitId, customHabit } = comm;
  const sel = habitId === "custom" ? { id: "custom", icon: "✨", label: customHabit?.label || t("customWrite"), sub: customHabit?.sub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habitId);

  const weeks = [];
  const days = Array.from({ length: duration }, (_, i) => ({ index: i, done: i < checkins }));
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <GlassCard hover={false} style={{ padding: 20 }}>
        <div style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.12em", marginBottom: 16 }}>{t("calendarTitle")}</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {t("weekDays").map(d => (
            <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 9, color: `var(--text-darker)`, letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {week.map((day, di) => (
              <div key={di} style={{
                flex: 1, aspectRatio: "1", borderRadius: 8,
                background: day.done ? (sel?.color || "#34d399") + "30" : `var(--card-bg)`,
                border: `1px solid ${day.done ? (sel?.color || "#34d399") + "60" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: day.done ? (sel?.color || "#34d399") : `var(--text-darker)`,
                transition: "all 0.2s",
              }}>
                {day.done ? "✓" : day.index + 1}
              </div>
            ))}
            {week.length < 7 && Array.from({ length: 7 - week.length }, (_, i) => (
              <div key={`e${i}`} style={{ flex: 1 }} />
            ))}
          </div>
        ))}
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <GlassCard hover={false} style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 6 }}>{t("currentStreak")}</div>
          <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#f472b6" }}>
            {checkins}
          </div>
          <div style={{ fontSize: 9, color: `var(--text-darker)` }}>{t("days").toLowerCase()}</div>
        </GlassCard>
        <GlassCard hover={false} style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 6 }}>{t("completion")}</div>
          <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#60a5fa" }}>
            {Math.round((duration > 0 ? checkins / duration : 0) * 100)}%
          </div>
          <div style={{ fontSize: 9, color: `var(--text-darker)` }}>{t("completedText")}</div>
        </GlassCard>
      </div>
    </div>
  );
}

function ContractTab({ comm }) {
  const { t, theme } = useGlobalState();
  const { duration, amount, habitId, txHash, payoutTxHash, checkins, customHabit } = comm;
  const sel = habitId === "custom" ? { id: "custom", icon: "✨", label: customHabit?.label || t("customWrite"), sub: customHabit?.sub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habitId);
  const rate = duration ? checkins / duration : 0;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <GlassCard hover={false} style={{ padding: 18 }}>
        <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 14 }}>{t("contractInfo")}</div>
        {[
          [t("cAddress"), "USDC: " + USDC_ADDRESS.slice(0,6) + "..." + USDC_ADDRESS.slice(-4)],
          [t("agentWallet"), AGENT_WALLET.slice(0,6) + "..." + AGENT_WALLET.slice(-4)],
          ["Network", "Base Sepolia"],
          ["Stake", `$${amount}`],
          [t("successThresh"), "%80"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 11, color: `var(--text-dark)` }}>{k}</span>
            <span style={{ fontSize: 11, color: `var(--text-muted)`, fontFamily: "'DM Mono', monospace" }}>{v}</span>
          </div>
        ))}
      </GlassCard>

      {/* Progress bar */}
      <GlassCard hover={false} style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: `var(--text-dark)`, letterSpacing: "0.1em" }}>{t("stakeStatus")}</span>
          <span style={{ fontSize: 10, color: rate >= 0.8 ? "#34d399" : "#f87171" }}>
            {rate >= 0.8 ? t("statusRefund") : t("statusRisk")}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${Math.round(Math.min(1, rate) * 100)}%`, borderRadius: 3, background: rate >= 0.8 ? "#34d399" : "#f87171", transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: `var(--text-darker)` }}>0%</span>
          <span style={{ fontSize: 10, color: "#a78bfa" }}>80% eşik</span>
          <span style={{ fontSize: 10, color: `var(--text-darker)` }}>100%</span>
        </div>
      </GlassCard>

      {/* Tx list */}
      <GlassCard hover={false} style={{ padding: 18 }}>
        <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 14 }}>{t("onchainTx")}</div>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div>
              <div style={{ fontSize: 11, color: "#34d399", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{txHash ? `0x${txHash.slice(2, 10)}...${txHash.slice(-4)}` : t("txWait")}</div>
              <div style={{ fontSize: 10, color: `var(--text-darker)` }}>{t("txStart")}</div>
            </div>
            {txHash && <div style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>✓ confirmed</div>}
        </div>
        {(payoutTxHash || checkins >= duration) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontSize: 11, color: payoutTxHash ? "#34d399" : "#a78bfa", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{payoutTxHash ? `0x${payoutTxHash.slice(2, 10)}...${payoutTxHash.slice(-4)}` : t("txWait")}</div>
                <div style={{ fontSize: 10, color: `var(--text-darker)` }}>SONUÇ · {rate >= 0.8 ? t("txSelf") : t("txDonate")}</div>
              </div>
              {payoutTxHash && <div style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>✓ confirmed</div>}
            </div>
        )}
      </GlassCard>
    </div>
  );
}

function Confetti({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 6 + 3,
      d: Math.random() * 80,
      color: ["#34d399", "#a78bfa", "#38bdf8", "#ff6b35", "#f472b6"][Math.floor(Math.random() * 5)],
      tilt: Math.random() * 10 - 10,
      speed: Math.random() * 4 + 3,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.4, p.tilt, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.y += p.speed;
        p.x += Math.sin(p.d) * 1;
        p.d += 0.05;
        if (p.y > canvas.height) p.y = -10;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      zIndex: 9999, pointerEvents: "none", opacity: active ? 1 : 0,
      transition: "opacity 0.5s"
    }} />
  );
}

export default function App() {
  const { t, lang, theme } = useGlobalState();
  const { isConnected, address, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const { writeContract, data: txHash, error: txError, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [screen, setScreen] = useState("setup");
  const [stagedConfig, setStagedConfig] = useState(null);
  
  const [commitmentsList, setCommitmentsList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(null); // 'setup' or commitId
  
  const [globalTab, setGlobalTab] = useState("active");
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (isConfirmed && stagedConfig) {
      registerPledgeWithAgent(txHash, stagedConfig);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (isConnected && address) {
      checkExistingCommitment(address);
    } else {
      setScreen("setup");
    }
  }, [isConnected, address]);

  async function checkExistingCommitment(walletAddress) {
    try {
      const res = await fetch(`${API_URL}/status/${walletAddress}`);
      const data = await res.json();
      if (data.active && data.commitments && data.commitments.length > 0) {
        setCommitmentsList(data.commitments.slice().reverse());
        setScreen("dashboard");
      } else {
        setCommitmentsList([]);
        setScreen("setup");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStart(cfg) {
    if (!isConnected) {
      connect({ connector: injected(), chainId: baseSepolia.id });
      return;
    }
    if (chainId !== baseSepolia.id) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch { return; }
    }
    setStagedConfig(cfg);
    const parsedAmount = parseUnits(cfg.amount.toString(), 6);
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [AGENT_WALLET, parsedAmount],
    });
  }

  async function registerPledgeWithAgent(hash, cfg) {
    setIsProcessing("setup");
    try {
      const res = await fetch(`${API_URL}/stake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          amount: cfg.amount,
          habitId: cfg.habit,
          customHabit: cfg.isCustomHabit ? { label: cfg.customHabitLabel, sub: cfg.customHabitSub } : null,
          duration: cfg.duration,
          charity: cfg.charity,
          txHash: hash
        })
      });
      
      if (!res.ok) {
        throw new Error(`Sunucu hatası: ${res.status}`);
      }
      
      setStagedConfig(null);
      await checkExistingCommitment(address);
      setScreen("dashboard");
    } catch (err) {
      console.error(err);
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
         alert(t("errConn"));
      } else {
         alert(t("errVal") + err.message);
      }
    }
    setIsProcessing(null);
  }

  async function handleCheckin(commitId, cDuration) {
    setIsProcessing(commitId);
    try {
      const res = await fetch(`${API_URL}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, commitId })
      });
      const data = await res.json();
      
      if (data.success) {
        setCommitmentsList(prev => prev.map(c => 
          c.id === commitId ? { ...c, checkins: data.checkins, payoutTxHash: data.payoutTxHash } : c
        ));
        if (data.isFinished && data.isSuccess) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 5000);
        }
      } else {
        alert("x402 AI Doğrulaması başarısız! " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı hatası");
    }
    setIsProcessing(null);
  }

  const tabs = [
    { id: "active", icon: <i className="bx bx-pulse"></i>, label: t("tabActive") },
    { id: "calendar", icon: <i className="bx bx-calendar"></i>, label: t("tabCalendar") },
    { id: "contract", icon: <i className="bx bx-receipt"></i>, label: t("tabContract") },
  ];

  const setupBtnText = isTxPending ? t("waitingWallet") 
                     : isConfirming ? t("verifyingBase") 
                     : isProcessing === "setup" ? t("agentSaving") 
                     : !isConnected ? t("connectWallet") 
                    : t("signStake");
                     
  const isSetupDisabled = isTxPending || isConfirming || isProcessing === "setup" || (!isConnected && false); // wagmi handles non-connected logic directly

  return (
    <div data-theme={theme} style={{ minHeight: "100vh", position: "relative" }}>
      <InteractiveBG />
      <Confetti active={confetti} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --bg: #06060e; --text: #fff; --text-muted: rgba(255,255,255,0.6); --text-dark: rgba(255,255,255,0.3); --text-darker: rgba(255,255,255,0.2);
          --card-bg: rgba(255,255,255,0.04); --card-bg-hover: rgba(255,255,255,0.07); --card-border: rgba(255,255,255,0.07); --card-border-hover: rgba(255,255,255,0.15);
          --line-strong: rgba(255,255,255,0.1);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); transition: background 0.3s; color: var(--text); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--card-border-hover); border-radius: 2px; }
        .mobile-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
        .mobile-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 380px) {
          .mobile-grid-2, .mobile-grid-3 { grid-template-columns: 1fr; }
        }
`}</style>

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'DM Mono', monospace", color: "#e8e8f0",
        padding: "0 16px 48px",
      }}>
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 440, paddingTop: 36, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: `var(--text)` }}>
                commit<span style={{ color: "#0000FF" }}>.base</span>
              </div>
              <div style={{ fontSize: 9, color: `var(--text-darker)`, letterSpacing: "0.14em", marginTop: 2 }}>
                {t("appSubtitle")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={toggleLang} style={{ background: "transparent", border: "1px solid var(--card-border)", borderRadius: 8, padding: "4px 8px", color: "var(--text)", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>{lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}</button>
              {!isConnected ? (
                <button onClick={() => connect({ connector: injected(), chainId: baseSepolia.id })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, color: `var(--text)`, fontSize: 9, padding: "4px 10px", cursor: "pointer" }}>{t("connectBtn")}</button>
              ) : (
                <button onClick={() => disconnect()} style={{ background: "transparent", border: "1px solid #34d39980", borderRadius: 20, color: "#34d399", fontSize: 9, padding: "4px 10px", cursor: "pointer" }}>{address.slice(0,6)}...{address.slice(-4)}</button>
              )}
            </div>
          </div>
          
          {isConnected && (
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
               <button onClick={() => setScreen("dashboard")} style={{ background: "transparent", border: "none", color: screen === "dashboard" ? "#34d399" : `var(--text-dark)`, fontFamily: "'DM Mono'", fontSize: 12, cursor: "pointer", borderBottom: screen === "dashboard" ? "1px solid #34d399" : "none", paddingBottom: 4 }}>{t("dashboard")}</button>
               <button onClick={() => setScreen("setup")} style={{ background: "transparent", border: "none", color: screen === "setup" ? "#34d399" : `var(--text-dark)`, fontFamily: "'DM Mono'", fontSize: 12, cursor: "pointer", borderBottom: screen === "setup" ? "1px solid #34d399" : "none", paddingBottom: 4 }}>{t("addNew")}</button>
            </div>
          )}

          <div style={{ height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)", marginTop: isConnected ? 12 : 16 }} />
        </div>

        <div style={{ width: "100%", maxWidth: 440 }}>
          {txError && screen === "setup" && (
             <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, marginBottom: 16, fontSize: 11, color: "#f87171", overflowWrap: 'break-word' }}>
               Hata: {txError.shortMessage || txError.message || "İşlem iptal edildi."}
             </div>
          )}

          {screen === "setup" && (
            <GlassCard hover={false} style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: `var(--text)`, marginBottom: 6 }}>
                  {t("createTitle")}
                </div>
                <div style={{ fontSize: 12, color: `var(--text-dark)`, lineHeight: 1.6 }}>
                  {t("createDesc")}
                </div>
              </div>
              <SetupFlow onStart={handleStart} btnText={setupBtnText} isTxDisabled={isSetupDisabled} />
            </GlassCard>
          )}

          {screen === "dashboard" && commitmentsList.length === 0 && (
             <GlassCard hover={false} style={{ padding: 24, textAlign: "center", color: `var(--text-dark)`, fontSize: 12 }}>
               {t("noActive")}
             </GlassCard>
          )}

          {screen === "dashboard" && commitmentsList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <TabBar tabs={tabs} active={globalTab} onChange={setGlobalTab} />
            </div>
          )}

          {screen === "dashboard" && commitmentsList.map((comm) => {
             const sel = comm.habitId === "custom" ? { id: "custom", icon: "✨", label: comm.customHabit?.label || t("customWrite"), sub: comm.customHabit?.sub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === comm.habitId);
             
             return (
               <div key={comm.id} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                 {/* Habit pill */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: `${sel?.color || "#34d399"}12`, border: `1px solid ${sel?.color || "#34d399"}30`, borderRadius: 50 }}>
                    <span style={{ fontSize: 16, color: sel?.color || "#34d399" }}>{sel?.icon || "✦"}</span>
                    <span style={{ fontSize: 13, color: sel?.color || "#34d399", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{comm.habitId === "custom" ? (comm.customHabit?.label || t("customWrite")) : (getHabits(t).find(h => h.id === comm.habitId)?.label || comm.habitId)}</span>
                    <span style={{ fontSize: 11, color: `var(--text-dark)`, marginLeft: 4 }}>{comm.habitId === "custom" ? (comm.customHabit?.sub || "") : (getHabits(t).find(h => h.id === comm.habitId)?.sub || "")}</span>
                    <div style={{ marginLeft: "auto", fontSize: 10, color: `var(--text-darker)`, fontFamily: "'DM Mono', monospace" }}>
                      {comm.duration}g · ${comm.amount}
                    </div>
                  </div>

                  {/* Tab content */}
                  {globalTab === "active" && <ActiveTab comm={comm} processingThis={isProcessing === comm.id} onCheckin={() => handleCheckin(comm.id, comm.duration)} />}
                  {globalTab === "calendar" && <CalendarTab comm={comm} />}
                  {globalTab === "contract" && <ContractTab comm={comm} />}
               </div>
             )
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
