import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId, useWriteContract, usePublicClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'wagmi/chains'
import { parseUnits, encodeFunctionData } from 'viem';
import CommitmentVaultABI from './abi/CommitmentVault.json';
import { BuilderCodeClientExtension } from '@x402/extensions/builder-code';

const BUILDER_CODE_VALUE = import.meta.env.VITE_BUILDER_CODE || 'bc_b2rs5woh';
const BUILDER_CODE_SUFFIX = '0xa16173816b62635f6232727335776f6800100280218021802180218021802180218021';

function appendBuilderCode(calldata) {
  const suffix = BUILDER_CODE_SUFFIX.startsWith('0x') ? BUILDER_CODE_SUFFIX.slice(2) : BUILDER_CODE_SUFFIX;
  return (calldata + suffix);
}

// Buyer attribution: lazily wrap fetch with x402 builder code extension
let _attributedFetch = null;
async function getAttributedFetch() {
  if (_attributedFetch) return _attributedFetch;
  try {
    const { x402Client, wrapFetchWithPayment } = await import('@x402/fetch');
    const client = new x402Client();
    client.registerExtension(new BuilderCodeClientExtension(BUILDER_CODE_VALUE));
    _attributedFetch = wrapFetchWithPayment(fetch, client);
  } catch {
    _attributedFetch = fetch;
  }
  return _attributedFetch;
}

const BUILDER_CODE_SUFFIX_HEX = import.meta.env.VITE_BUILDER_CODE_SUFFIX ? (import.meta.env.VITE_BUILDER_CODE_SUFFIX.startsWith("0x") ? import.meta.env.VITE_BUILDER_CODE_SUFFIX : `0x${import.meta.env.VITE_BUILDER_CODE_SUFFIX}`) : "";

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
    completed: "TAMAMLANAN", remaining: "KALAN", successRate: "BAŞARI", rateStr: "oran", network: "NETWORK", calendarTitle: "TAAHHÜT TAKVİMİ", currentStreak: "GÜNCEL SERİ", completion: "TAMAMLANMA", completedText: "tamamlandı", weekDays: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
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
    completed: "COMPLETED", remaining: "REMAINING", successRate: "SUCCESS", rateStr: "rate", network: "NETWORK", calendarTitle: "COMMITMENT CALENDAR", currentStreak: "CURRENT STREAK", completion: "COMPLETION", completedText: "completed", weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    contractInfo: "CONTRACT INFO", cAddress: "Contract address", agentWallet: "Agent Wallet", successThresh: "Success threshold", stakeStatus: "STAKE STATUS", statusRefund: "will refund", statusRisk: "at risk",
    onchainTx: "ONCHAIN TRANSACTIONS", txStart: "STAKE · Initiation", txWait: "Pending", txResult: "RESULT", txConfirmed: "✓ confirmed", txDonate: "Penalty Transfer", txSelf: "Refund",
    appSubtitle: "ONCHAIN HABIT PROTOCOL", connectBtn: "Connect", dashboard: "Dashboard", addNew: "New Target",
    createTitle: "Create your commitment", createDesc: "Select a habit, stake USDC. Get it back if you succeed.", noActive: "No active commitments. Create a new habit now.",
    tabActive: "active", tabCalendar: "calendar", tabContract: "contract", waitingWallet: "Waiting Wallet Approval...", verifyingBase: "Verifying on Base...", agentSaving: "Agent Saving...", connectWallet: "Connect Wallet",
    errConn: "Connection error: Background service (agent-backend) is offline. Please start it.", errVal: "Validation failed: "
  }
};
let currentLang = "tr";
let currentTheme = (typeof localStorage !== "undefined" && localStorage.getItem("theme")) || "dark";
const themeListeners = new Set();
function useGlobalState() {
  const [state, setState] = useState({ lang: currentLang, theme: currentTheme });
  useEffect(() => {
    const fn = () => setState({ lang: currentLang, theme: currentTheme });
    themeListeners.add(fn);
    return () => themeListeners.delete(fn);
  }, []);
  const t = (k) => TRANSLATIONS[state.lang][k] || k;
  return { t, lang: state.lang, theme: state.theme };
}
export function toggleLang() { currentLang = currentLang === "tr" ? "en" : "tr"; themeListeners.forEach(f => f()); }
export function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  if (typeof localStorage !== "undefined") localStorage.setItem("theme", currentTheme);
  themeListeners.forEach(f => f());
}

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

// Define USDC Contracts on different networks
const USDC_ADDRESSES = {
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",      // Base Mainnet
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};
const VAULT_ADDRESSES = {
  [baseSepolia.id]: "0x5bf1Db1C1b238C2E3B769AdBd4b9370e5D3BAF84", // Base Sepolia
  [base.id]: "0x34D15fCA31102211F98c3a0D8F3715Aa4197DD3a",  // Base Mainnet
};
const erc20Abi = [
  {
    "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];
const API_URL = import.meta.env.VITE_API_URL || "/api";
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

    const isLight = theme === "light";
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isLight ? "#f4f5fa" : "#06060e";
      ctx.fillRect(0, 0, W, H);

      orbs.current.forEach((o, i) => {
        o.x += o.vx + (mouse.current.x - W / 2) * 0.00015 * (i % 2 === 0 ? 1 : -1);
        o.y += o.vy + (mouse.current.y - H / 2) * 0.00015 * (i % 2 === 0 ? -1 : 1);
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color},${isLight ? 0.12 : 0.18})`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // grid noise
      ctx.strokeStyle = isLight ? "rgba(11,13,23,0.03)" : "rgba(255,255,255,0.018)";
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
  }, [theme]);

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

          <button disabled={!habit || (isCustomHabit && !customHabitLabel)} onClick={() => setStep(1)} className="ui-btn" style={{
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
            <button disabled={!duration || duration < 1} onClick={() => setStep(2)} className="ui-btn" style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: duration > 0 ? "#34d399" : `var(--line-strong)`, color: duration > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: duration > 0 ? "pointer" : "not-allowed" }}>devam et →</button>
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
             <input type="number" min="0.0001" step="0.0001" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))} style={{ width: "100%", padding: "12px", background: `var(--card-bg)`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: `var(--text)`, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none" }} />
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
            <button onClick={() => setStep(3)} disabled={!charity || !amount || Number(amount) <= 0} className="ui-btn" style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: charity && amount > 0 ? "#a78bfa" : `var(--line-strong)`, color: charity && amount > 0 ? "#06060e" : `var(--text-dark)`, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", cursor: charity && amount > 0 ? "pointer" : "not-allowed" }}>devam et →</button>
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
            <button onClick={() => onStart({ habit, isCustomHabit, customHabitLabel, customHabitSub, duration, amount, charity })} disabled={isTxDisabled} className={`ui-btn ${isTxDisabled ? "" : "ui-gradient"}`} style={{ flex: 1, padding: "14px", border: "none", borderRadius: 10, background: isTxDisabled ? "var(--line-strong)" : undefined, color: isTxDisabled ? `var(--text-dark)` : "#06060e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: isTxDisabled ? "not-allowed" : "pointer", letterSpacing: "0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {isTxDisabled ? (<><span className="ui-spinner" /> {btnText || t("signStake")}</>) : (btnText || t("signStake"))}
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

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (checkins === 0) return;
    const lastTime = comm.lastCheckinDate || (comm.startDate ? new Date(comm.startDate).getTime() : 0);
    if (!lastTime) return;
    
    const updateTime = () => {
      const remaining = (lastTime + 24 * 60 * 60 * 1000) - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [comm.lastCheckinDate, comm.startDate, checkins]);

  const isWaiting = timeLeft > 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const countdownStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const btnDisabled = processingThis || isWaiting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero ring */}
      <GlassCard hover={false} style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 11, color: `var(--text-dark)`, letterSpacing: "0.12em" }}>{t("activeCommit")}</div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className={!isComplete && !isWaiting && !processingThis ? "ui-pulse" : ""} style={{ position: "absolute", width: 180, height: 180, color: sel?.color || "#34d399" }} />
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
          <button onClick={onCheckin} disabled={btnDisabled} className="ui-btn" style={{
            width: 200, padding: "14px 0",
            border: `1px solid ${btnDisabled ? "rgba(255,255,255,0.08)" : (sel?.color || "#34d399") + "80"}`,
            borderRadius: 50, cursor: btnDisabled ? "not-allowed" : "pointer",
            background: btnDisabled ? "rgba(255,255,255,0.03)" : `${sel?.color || "#34d399"}18`,
            color: btnDisabled ? `var(--text-darker)` : sel?.color || "#34d399",
            fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {processingThis
              ? (<><span className="ui-spinner" /> {t("verifying")}</>)
              : isWaiting
                ? (<><i className="bx bx-time-five" style={{ fontSize: 15 }}></i> {countdownStr}</>)
                : t("checkinNow")}
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
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <span className="ui-dot" style={{ color: "#34d399" }} />
            {comm.chainId === baseSepolia.id ? "Base Sepolia" : "Base Mainnet"}
          </div>
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

function ContractTab({ comm, selectedNetwork, networks, onOpenHistory }) {
  const { t, theme } = useGlobalState();
  const { duration, amount, habitId, txHash, payoutTxHash, checkins, customHabit } = comm;
  const sel = habitId === "custom" ? { id: "custom", icon: "✨", label: customHabit?.label || t("customWrite"), sub: customHabit?.sub || "", color: "#fcd34d" } : getHabits(t).find(h => h.id === habitId);
  const rate = duration ? checkins / duration : 0;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <GlassCard hover={false} style={{ padding: 18 }}>
        <div style={{ fontSize: 10, color: `var(--text-darker)`, letterSpacing: "0.1em", marginBottom: 14 }}>{t("contractInfo")}</div>
        {(() => {
          const netId = comm.chainId ?? selectedNetwork;
          const usdcAddr = USDC_ADDRESSES[netId] || "0x0";
          const usdcLabel = usdcAddr && usdcAddr.length > 10 ? `USDC: ${usdcAddr.slice(0,6)}...${usdcAddr.slice(-4)}` : `USDC: ${usdcAddr}`;
          const vaultAddr = VAULT_ADDRESSES[netId] || "—";
          const vaultLabel = vaultAddr.length > 10 ? `${vaultAddr.slice(0,6)}...${vaultAddr.slice(-4)}` : vaultAddr;
          return [
            [t("cAddress"), vaultLabel],
            ["USDC", usdcLabel],
            ["Network", networks.find(n => n.id === netId)?.name || "—"],
            ["Stake", `$${amount}`],
            [t("successThresh"), "%80"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 11, color: `var(--text-dark)` }}>{k}</span>
              <span style={{ fontSize: 11, color: `var(--text-muted)`, fontFamily: "'DM Mono', monospace" }}>{v}</span>
            </div>
          ));
        })()}
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => onOpenHistory && onOpenHistory()} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text)', cursor: 'pointer' }}>
          View history
        </button>
      </div>
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
  const currentChainId = useChainId();

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [txError, setTxError] = useState(null);
  const isTxPending = false;

  const [screen, setScreen] = useState("setup");
  const [stagedConfig, setStagedConfig] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(base.id);
  
  const [commitmentsList, setCommitmentsList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(null); // 'setup' or commitId
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [globalTab, setGlobalTab] = useState("active");
  const [confetti, setConfetti] = useState(false);

  // Tema'yı body'e yansıt (scrollbar/overscroll alanı da doğru renkte olsun)
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const networks = [
    { id: base.id, name: "Base Mainnet", label: "🌐 Base Mainnet" },
    { id: baseSepolia.id, name: "Base Sepolia", label: "🧪 Base Sepolia" }
  ];

  const handleNetworkSwitch = async (netId) => {
    if (!isConnected) {
      setSelectedNetwork(netId);
      return;
    }
    try {
      await switchChainAsync({ chainId: netId });
      setSelectedNetwork(netId);
    } catch (err) {
      console.error("Network switch failed:", err);
      // Cüzdan ağ değişimini reddetti/başarısız: dropdown'ı gerçek ağa geri al
      if (currentChainId) setSelectedNetwork(currentChainId);
    }
  };

  // Dropdown her zaman cüzdanın GERÇEK ağını yansıtsın (UI yalan söylemesin)
  useEffect(() => {
    if (isConnected && currentChainId) {
      setSelectedNetwork(currentChainId);
    }
  }, [isConnected, currentChainId]);

  useEffect(() => {
    if (isConnected && address) {
      checkExistingCommitment(address);
    } else {
      setScreen("setup");
    }
  }, [isConnected, address]);

  async function checkExistingCommitment(walletAddress) {
    try {
      const afetch = await getAttributedFetch();
      const res = await afetch(`${API_URL}/status/${walletAddress}`);
      const data = await res.json();
      if (data.active && data.commitments && data.commitments.length > 0) {
        setCommitmentsList(data.commitments.slice().reverse());
        setScreen("dashboard");
      } else {
        // Fallback to localStorage if API doesn't have data
        const localCommitments = localStorage.getItem(`commitments_${walletAddress}`);
        if (localCommitments) {
          const parsed = JSON.parse(localCommitments);
          if (parsed.length > 0) {
            setCommitmentsList(parsed.slice().reverse());
            setScreen("dashboard");
            return;
          }
        }
        setCommitmentsList([]);
        setScreen("setup");
      }
    } catch (err) {
      console.error(err);
      // Fallback to localStorage on API error
      const localCommitments = localStorage.getItem(`commitments_${walletAddress}`);
      if (localCommitments) {
        const parsed = JSON.parse(localCommitments);
        if (parsed.length > 0) {
          setCommitmentsList(parsed.slice().reverse());
          setScreen("dashboard");
          return;
        }
      }
      setCommitmentsList([]);
      setScreen("setup");
    }
  }

  async function handleStart(cfg) {
    if (!isConnected) {
      connect({ connector: injected(), chainId: selectedNetwork });
      return;
    }
    if (chainId !== selectedNetwork) {
      try {
        await switchChainAsync({ chainId: selectedNetwork });
      } catch { return; }
    }

    const vaultAddress = VAULT_ADDRESSES[selectedNetwork];
    if (!vaultAddress) {
      alert(lang === 'tr'
        ? "Bu ağda kontrat henüz tanımlı değil. Lütfen başka bir ağ seçin."
        : "Contract is not yet deployed on this network. Please choose another network.");
      return;
    }
    const usdcAddress = USDC_ADDRESSES[selectedNetwork];
    if (!usdcAddress) {
      alert("USDC adresi bu ağ için tanımlı değil.");
      return;
    }

    setStagedConfig(cfg);
    const parsedAmount = parseUnits(cfg.amount.toString(), 6);

    try {
      // Ön kontrol: bakiye yeterli mi?
      const balance = await publicClient.readContract({
        address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: [address],
      });
      if (balance < parsedAmount) {
        const have = (Number(balance) / 1e6).toString();
        alert(lang === 'tr'
          ? `Yetersiz USDC bakiyesi. Bu ağda ${have} USDC'niz var, ${cfg.amount} USDC gerekiyor.`
          : `Insufficient USDC balance. You have ${have} USDC on this network, but ${cfg.amount} USDC is required.`);
        setStagedConfig(null);
        return;
      }

      // Step 1: approve — sadece mevcut allowance yetersizse
      const currentAllowance = await publicClient.readContract({
        address: usdcAddress, abi: erc20Abi, functionName: 'allowance', args: [address, vaultAddress],
      });
      if (currentAllowance < parsedAmount) {
        console.log("Step 1: approve", { usdcAddress, vaultAddress, parsedAmount });
        const approveTxHash = await writeContractAsync({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [vaultAddress, parsedAmount],
        });
        console.log("Approve tx:", approveTxHash);
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      } else {
        console.log("Allowance yeterli, approve atlandı.");
      }

      // Step 2: createCommitment
      console.log("Step 2: createCommitment", { vaultAddress, parsedAmount, duration: cfg.duration, charity: cfg.charity });
      const createCalldata = appendBuilderCode(encodeFunctionData({
        abi: CommitmentVaultABI,
        functionName: 'createCommitment',
        args: [parsedAmount, BigInt(cfg.duration), cfg.charity, BigInt(80)],
      }));
      const createTxHash = await writeContractAsync({
        address: vaultAddress,
        abi: CommitmentVaultABI,
        functionName: 'createCommitment',
        args: [parsedAmount, BigInt(cfg.duration), cfg.charity, BigInt(80)],
        data: createCalldata,
      });
      console.log("CreateCommitment tx:", createTxHash);
      await registerPledgeWithAgent(createTxHash, cfg);
    } catch (err) {
      console.error("handleStart error:", err);
      setTxError(err);
      setStagedConfig(null);
    }
  }

  async function registerPledgeWithAgent(hash, cfg) {
    setIsProcessing("setup");
    const vaultAddress = VAULT_ADDRESSES[selectedNetwork];
    let commitmentId = null;

    // 1) İşlemin onaylanmasını (mine edilmesini) bekle ve event'ten id'yi oku
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120000 });
      // CommitmentCreated event: topics[1] = id (indexed uint256)
      const createdLog = receipt?.logs?.find(
        l => l.address?.toLowerCase() === vaultAddress?.toLowerCase()
      );
      if (createdLog?.topics?.[1]) {
        commitmentId = BigInt(createdLog.topics[1]).toString();
      }
    } catch (err) {
      console.error("waitForTransactionReceipt hatası:", err);
    }

    // 2) Event okunamadıysa zincirden son id'yi türet
    if (commitmentId === null) {
      try {
        const next = await publicClient.readContract({
          address: vaultAddress, abi: CommitmentVaultABI, functionName: 'nextCommitmentId',
        });
        commitmentId = (BigInt(next) - 1n).toString();
      } catch {
        commitmentId = Date.now().toString();
      }
    }
    console.log("commitmentId:", commitmentId);

    // 3) Kaydet ve dashboard'a geç (her durumda)
    const newCommitment = {
      id: commitmentId,
      onchainId: commitmentId,
      chainId: selectedNetwork,
      amount: cfg.amount,
      habitId: cfg.habit,
      customHabit: cfg.isCustomHabit ? { label: cfg.customHabitLabel, sub: cfg.customHabitSub } : null,
      duration: cfg.duration,
      charity: cfg.charity,
      txHash: hash,
      checkins: 0,
      startDate: new Date().toISOString(),
    };

    const local = localStorage.getItem(`commitments_${address}`);
    const list = local ? JSON.parse(local) : [];
    list.push(newCommitment);
    localStorage.setItem(`commitments_${address}`, JSON.stringify(list));

    setStagedConfig(null);
    setCommitmentsList(list.slice().reverse());
    setScreen("dashboard");
    setIsProcessing(null);
  }

  async function handleCheckin(commitId, cDuration) {
    setIsProcessing(commitId);

    // Bu taahhüt hangi ağda oluşturulduysa o ağı kullan (dropdown'dan bağımsız)
    const local = localStorage.getItem(`commitments_${address}`);
    const list = local ? JSON.parse(local) : [];
    const commitment = list.find(c => c.id === commitId);
    const commChainId = commitment?.chainId ?? selectedNetwork;
    const vaultAddress = VAULT_ADDRESSES[commChainId];
    if (!vaultAddress) {
      alert(lang === 'tr' ? "Kontrat bu ağda tanımlı değil." : "Contract not deployed on this network.");
      setIsProcessing(null);
      return;
    }

    // Cüzdan taahhüdün ağında değilse o ağa geç
    if (chainId !== commChainId) {
      try {
        await switchChainAsync({ chainId: commChainId });
      } catch {
        setIsProcessing(null);
        return;
      }
    }

    // onchainId varsa onu kullan, yoksa commitId'yi dene
    const onchainId = commitment?.onchainId ?? commitId;

    try {
      const checkinCalldata = appendBuilderCode(encodeFunctionData({
        abi: CommitmentVaultABI,
        functionName: 'checkin',
        args: [BigInt(onchainId)],
      }));
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: CommitmentVaultABI,
        functionName: 'checkin',
        args: [BigInt(onchainId)],
        chainId: commChainId,
        data: checkinCalldata,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Onchain'den güncel checkin sayısını oku
      const onchainData = await publicClient.readContract({
        address: vaultAddress,
        abi: CommitmentVaultABI,
        functionName: 'getCommitment',
        args: [BigInt(onchainId)],
      });
      const newCheckins = Number(onchainData.checkins);
      const now = Date.now();

      const isFinished = newCheckins >= cDuration;

      setCommitmentsList(prev => prev.map(c =>
        c.id === commitId ? { ...c, checkins: newCheckins, lastCheckinDate: now, isFinished } : c
      ));

      // localStorage güncelle
      const updated = list.map(c =>
        c.id === commitId ? { ...c, checkins: newCheckins, lastCheckinDate: now, isFinished } : c
      );
      localStorage.setItem(`commitments_${address}`, JSON.stringify(updated));

      if (newCheckins >= cDuration) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 5000);
      }
    } catch (err) {
      console.error("Checkin error:", err);
      alert(err.shortMessage || err.message || "Check-in başarısız.");
    }
    setIsProcessing(null);
  }

  async function openHistory() {
    if (isConnected && address) {
      await checkExistingCommitment(address);
      setShowHistoryModal(true);
    } else {
      alert(t("connectWallet"));
    }
  }

  const tabs = [
    { id: "active", icon: <i className="bx bx-pulse"></i>, label: t("tabActive") },
    { id: "calendar", icon: <i className="bx bx-calendar"></i>, label: t("tabCalendar") },
    { id: "contract", icon: <i className="bx bx-receipt"></i>, label: t("tabContract") },
  ];

  const setupBtnText = isProcessing === "setup" ? t("agentSaving")
                     : !isConnected ? t("connectWallet")
                     : t("signStake");

  const isSetupDisabled = isProcessing === "setup";

  return (
    <div data-theme={theme} style={{ minHeight: "100dvh", position: "relative" }}>
      <InteractiveBG />
      <Confetti active={confetti} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;600;700;800&display=swap');
        :root, [data-theme="dark"] {
          --bg: #06060e; --text: #fff; --text-muted: rgba(255,255,255,0.6); --text-dark: rgba(255,255,255,0.3); --text-darker: rgba(255,255,255,0.2);
          --card-bg: rgba(255,255,255,0.04); --card-bg-hover: rgba(255,255,255,0.07); --card-border: rgba(255,255,255,0.07); --card-border-hover: rgba(255,255,255,0.15);
          --line-strong: rgba(255,255,255,0.1);
        }
        [data-theme="light"] {
          --bg: #f4f5fa; --text: #0b0d17; --text-muted: rgba(11,13,23,0.7); --text-dark: rgba(11,13,23,0.45); --text-darker: rgba(11,13,23,0.32);
          --card-bg: rgba(255,255,255,0.75); --card-bg-hover: rgba(255,255,255,0.95); --card-border: rgba(11,13,23,0.1); --card-border-hover: rgba(11,13,23,0.2);
          --line-strong: rgba(11,13,23,0.12);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }
        body {
          background: var(--bg); transition: background 0.3s; color: var(--text);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -webkit-tap-highlight-color: transparent;
        }
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        /* iOS: metin/sayı input'u 16px'den küçükse odakta otomatik zoom yapar; engelle */
        input, textarea { font-size: 16px !important; }
        input::placeholder, textarea::placeholder { color: var(--text-darker); }
        /* Light modda saydam-beyaz kenarlıklar kaybolur; input/select'leri okunur kıl */
        [data-theme="light"] input,
        [data-theme="light"] textarea,
        [data-theme="light"] select {
          background: rgba(255,255,255,0.9) !important;
          border-color: var(--card-border) !important;
          color: var(--text) !important;
        }
        [data-theme="light"] input:focus,
        [data-theme="light"] textarea:focus { border-color: #34d399 !important; }
        /* Mobil: header kontrol butonlarına rahat dokunma yüksekliği */
        @media (max-width: 440px) {
          .theme-toggle { width: 48px; height: 26px; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--card-border-hover); border-radius: 2px; }
        .mobile-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
        .mobile-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 340px) {
          .mobile-grid-3 { grid-template-columns: 1fr 1fr; }
        }

        /* ===== uiverse-inspired animations ===== */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.35); }
          50% { box-shadow: 0 0 22px 4px rgba(52,211,153,0.0); }
        }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        /* Animated spinner (loader) */
        .ui-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid currentColor; border-top-color: transparent;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          vertical-align: middle;
        }

        /* Glowing / lifting button */
        .ui-btn { position: relative; overflow: hidden; transition: transform .18s cubic-bezier(.4,0,.2,1), box-shadow .25s, filter .2s; }
        .ui-btn:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 8px 24px -6px rgba(52,211,153,0.45); }
        .ui-btn:not(:disabled):active { transform: translateY(0) scale(0.98); }
        /* sweeping shine across the button on hover */
        .ui-btn::after {
          content: ""; position: absolute; top: 0; left: 0; width: 60%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: translateX(-150%); pointer-events: none;
        }
        .ui-btn:not(:disabled):hover::after { animation: shimmer 0.9s ease; }

        /* Flowing gradient for the primary CTA */
        .ui-gradient {
          background: linear-gradient(110deg,#34d399,#a78bfa,#34d399);
          background-size: 200% 100%;
          animation: gradientShift 3s linear infinite;
        }

        /* Card sheen on hover */
        .ui-card { position: relative; overflow: hidden; }
        .ui-card::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
          transform: translateX(-120%); transition: transform .6s ease; pointer-events: none;
        }
        .ui-card:hover::before { transform: translateX(120%); }

        /* Pulsing ring around the active commitment */
        .ui-pulse { border-radius: 50%; animation: pulseGlow 2.4s ease-in-out infinite; }

        /* Network status dot */
        .ui-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; box-shadow: 0 0 0 0 currentColor; animation: pulseGlow 2s infinite; }

        /* ===== Jumping cube loader (Uiverse.io by JaydipPrajapati1910), scaled for logo ===== */
        .logo-loader { width: 22px; height: 22px; position: relative; flex: 0 0 auto; }
        .logo-loader:before {
          content: ''; width: 22px; height: 3px; background: var(--text-darker);
          position: absolute; top: 27px; left: 0; border-radius: 50%;
          animation: shadow324 0.5s linear infinite;
        }
        .logo-loader:after {
          content: ''; width: 100%; height: 100%; background: rgb(61,106,255);
          position: absolute; top: 0; left: 0; border-radius: 3px;
          animation: jump7456 0.5s linear infinite;
        }
        @keyframes jump7456 {
          15% { border-bottom-right-radius: 2px; }
          25% { transform: translateY(4px) rotate(22.5deg); }
          50% { transform: translateY(8px) scale(1, .9) rotate(45deg); border-bottom-right-radius: 18px; }
          75% { transform: translateY(4px) rotate(67.5deg); }
          100% { transform: translateY(0) rotate(90deg); }
        }
        @keyframes shadow324 {
          0%, 100% { transform: scale(1, 1); }
          50% { transform: scale(1.2, 1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-loader:before, .logo-loader:after { animation: none !important; }
        }

        /* ===== Day/Night theme toggle (uiverse-inspired) ===== */
        .theme-toggle {
          position: relative; width: 52px; height: 28px; flex: 0 0 auto;
          border-radius: 50px; cursor: pointer; border: 1px solid var(--card-border);
          background: var(--card-bg); overflow: hidden; padding: 0;
          transition: background .4s, border-color .4s;
        }
        [data-theme="dark"] .theme-toggle { background: linear-gradient(135deg,#1a1c3a,#0a0e27); }
        [data-theme="light"] .theme-toggle { background: linear-gradient(135deg,#aee1ff,#fbd786); }
        .theme-toggle .knob {
          position: absolute; top: 2px; left: 2px; width: 22px; height: 22px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: transform .45s cubic-bezier(.4,0,.2,1), background .4s, color .4s;
        }
        [data-theme="dark"] .theme-toggle .knob { transform: translateX(0); background: #11132a; color: #cfd2ff; }
        [data-theme="light"] .theme-toggle .knob { transform: translateX(24px); background: #fff7e0; color: #f59e0b; }
        .theme-toggle .knob i { animation: floaty 3s ease-in-out infinite; }
        /* faint sun/moon hint on the opposite side */
        .theme-toggle .bg-icon { position: absolute; top: 50%; transform: translateY(-50%); font-size: 12px; opacity: .55; }
        .theme-toggle .bg-icon.sun { left: 7px; color: #fff3c4; }
        .theme-toggle .bg-icon.moon { right: 7px; color: #c7cbff; }
        [data-theme="light"] .theme-toggle .bg-icon.moon { opacity: 0; }
        [data-theme="dark"] .theme-toggle .bg-icon.sun { opacity: 0; }

        @media (prefers-reduced-motion: reduce) {
          .ui-gradient, .ui-pulse, .ui-dot, .ui-spinner { animation: none !important; }
          .ui-btn::after, .ui-card::before { display: none; }
        }
`}</style>

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'DM Mono', monospace", color: "#e8e8f0",
        padding: "0 calc(16px + env(safe-area-inset-right)) calc(48px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))",
      }}>
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 440, paddingTop: "calc(36px + env(safe-area-inset-top))", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="logo-loader" aria-hidden="true" />
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: `var(--text)` }}>
                  commit<span style={{ color: "#0000FF" }}>.base</span>
                </div>
              </div>
              <div style={{ fontSize: 9, color: `var(--text-darker)`, letterSpacing: "0.14em", marginTop: 2 }}>
                {t("appSubtitle")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", flex: "0 1 auto" }}>
              <select
                value={selectedNetwork}
                onChange={(e) => handleNetworkSwitch(Number(e.target.value))}
                style={{ 
                  background: "transparent", 
                  border: "1px solid var(--card-border)", 
                  borderRadius: 8, 
                  padding: "4px 8px", 
                  color: "var(--text)", 
                  cursor: "pointer", 
                  fontSize: 11, 
                  fontWeight: "bold",
                  fontFamily: "'DM Mono', monospace"
                }}
              >
                {networks.map(net => (
                  <option key={net.id} value={net.id} style={{ background: theme === "light" ? "#ffffff" : "#0a0e27", color: theme === "light" ? "#0b0d17" : "#ffffff" }}>
                    {net.label}
                  </option>
                ))}
              </select>
              <button onClick={toggleTheme} className="theme-toggle" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Gündüz modu" : "Gece modu"}>
                <i className="bx bxs-sun bg-icon sun"></i>
                <i className="bx bxs-moon bg-icon moon"></i>
                <span className="knob">
                  <i className={theme === "dark" ? "bx bxs-moon" : "bx bxs-sun"}></i>
                </span>
              </button>
              <button onClick={toggleLang} style={{ background: "transparent", border: "1px solid var(--card-border)", borderRadius: 8, padding: "4px 8px", color: "var(--text)", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>{lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}</button>
              {!isConnected ? (
                <button onClick={() => connect({ connector: injected(), chainId: selectedNetwork })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, color: `var(--text)`, fontSize: 9, padding: "4px 10px", cursor: "pointer" }}>{t("connectBtn")}</button>
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

          <div style={{ height: 1, background: "linear-gradient(90deg, var(--line-strong), transparent)", marginTop: isConnected ? 12 : 16 }} />
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

          {screen === "dashboard" && (() => {
            const activeCommitments = commitmentsList.filter(comm => {
              if (comm.chainId && comm.chainId !== selectedNetwork) return false;
              const finished = comm.isFinished || (comm.duration > 0 && comm.checkins >= comm.duration);
              return !finished;
            });

            return (<>
              {activeCommitments.length === 0 && (
                <GlassCard hover={false} style={{ padding: 24, textAlign: "center", color: `var(--text-dark)`, fontSize: 12 }}>
                  {t("noActive")}
                </GlassCard>
              )}

              {activeCommitments.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <TabBar tabs={tabs} active={globalTab} onChange={setGlobalTab} />
                </div>
              )}

              {activeCommitments.map((comm) => {
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
                    {globalTab === "contract" && <ContractTab comm={comm} selectedNetwork={selectedNetwork} networks={networks} onOpenHistory={openHistory} />}
                  </div>
                );
              })}
            </>);
          })()}

          {showHistoryModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
              <div style={{ width: 720, maxWidth: '95%', background: '#061024', padding: 20, borderRadius: 12, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Your Commitments</h3>
                  <button onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: 8 }}>Close</button>
                </div>
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                  {commitmentsList.length === 0 ? (
                    <div>No commitments found.</div>
                  ) : (
                    commitmentsList.map(c => (
                      <div key={c.id} style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{c.habitId === 'custom' ? (c.customHabit?.label || 'Custom') : c.habitId}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.duration} days · ${c.amount}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace" }}>
                            <div>Checkins: {c.checkins}</div>
                            <div style={{ marginTop: 8 }}>{c.txHash ? (<a href={`https://etherscan.io/tx/${c.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{c.txHash.slice(0,10)}...{c.txHash.slice(-6)}</a>) : '—'}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
