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
    activeCommit: "AKTİF TAAHHÜT", checkinNow: "bugün check-in", verifying: "", successRefund: "🎉 başarı! iade yolda", failNoRefund: "⚠ iade eşiği aşılamadı",
    completed: "TAMAMLANAN", remaining: "KALAN", successRate: "BAŞARI", rateStr: "oran", network: "NETWORK", calendarTitle: "TAAHHÜT TAKVİMİ", currentStreak: "GÜNCEL SERİ", completion: "TAMAMLANMA", completedText: "tamamlandı", weekDays: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    contractInfo: "KONTRAT BİLGİSİ", cAddress: "Kontrat adresi", agentWallet: "Ajan Cüzdan", successThresh: "Başarı eşiği", stakeStatus: "STAKE DURUMU", statusRefund: "iade edilecek", statusRisk: "risk altında",
    onchainTx: "ONCHAIN İŞLEMLER", txStart: "STAKE · Başlangıç", txWait: "Bekleniyor", txResult: "SONUÇ", txConfirmed: "✓ confirmed", txDonate: "Ceza Adresine Transfer", txSelf: "İade",
    appSubtitle: "ONCHAIN HABIT PROTOCOL", connectBtn: "Bağlan", dashboard: "Dashboard", addNew: "Yeni Ekle",
    createTitle: "Taahhüdünü oluştur", createDesc: "Alışkanlığını seç, USDC stake et. Başarırsan paranı geri al.", noActive: "Aktif taahhüdün yok. Hemen yeni bir alışkanlık oluştur.",
    tabActive: "aktif", tabCalendar: "takvim", tabContract: "kontrat", waitingWallet: "Cüzdan Onayı Bekleniyor...", verifyingBase: "Ağda Doğrulanıyor...", agentSaving: "", connectWallet: "Cüzdan Bağla",
    errConn: "", errVal: "Doğrulama başarısız: "
  },
  en: {
    sport: "Sport", read: "Reading", meditate: "Meditate", nosugar: "No Sugar", code: "Coding", water: "Water",
    sportSub: "30 min exercise", readSub: "20 pages book", meditateSub: "10 min breathing", nosugarSub: "Zero sugar", codeSub: "1 hr dev", waterSub: "2 liters/day",
    chooseHabit: "CHOOSE HABIT", customWrite: "Custom Habit", customDest: "Write your own",
    habitName: "HABIT NAME", habitNamePH: "e.g., Morning Run", habitTarget: "GOAL / DETAILS", habitTargetPH: "e.g., Run 5 km",
    duration: "DURATION", days: "DAYS", customDuration: "OR ENTER CUSTOM DURATION (DAYS)", endDate: "end date",
    back: "← back", next: "continue →", stakeAmount: "STAKE AMOUNT", customAmount: "OR ENTER CUSTOM AMOUNT (USDC)",
    penaltyTitle: "PENALTY ADDRESS (ON FAILURE)", penaltyPH: "0x... (Wallet Address)", summary: "SUMMARY", sumHabit: "Habit", sumDuration: "Duration", sumStake: "Stake", sumSuccess: "Success", sumSuccessDest: "80% check-in → full refund", sumFail: "Failure", sumFailDest: "will receive", sumFailDef: "Sent to penalty address",
    confirmTitle: "CONFIRM COMMITMENT", threshold: "THRESHOLD", contractHint: "USDC locked in smart contract. Daily check-in creates onchain proof.", signStake: "sign contract & stake",
    activeCommit: "ACTIVE COMMITMENT", checkinNow: "check-in today", verifying: "", successRefund: "🎉 success! refund on way", failNoRefund: "⚠ refund threshold failed",
    completed: "COMPLETED", remaining: "REMAINING", successRate: "SUCCESS", rateStr: "rate", network: "NETWORK", calendarTitle: "COMMITMENT CALENDAR", currentStreak: "CURRENT STREAK", completion: "COMPLETION", completedText: "completed", weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    contractInfo: "CONTRACT INFO", cAddress: "Contract address", agentWallet: "Agent Wallet", successThresh: "Success threshold", stakeStatus: "STAKE STATUS", statusRefund: "will refund", statusRisk: "at risk",
    onchainTx: "ONCHAIN TRANSACTIONS", txStart: "STAKE · Initiation", txWait: "Pending", txResult: "RESULT", txConfirmed: "✓ confirmed", txDonate: "Penalty Transfer", txSelf: "Refund",
    appSubtitle: "ONCHAIN HABIT PROTOCOL", connectBtn: "Connect", dashboard: "Dashboard", addNew: "New Target",
    createTitle: "Create your commitment", createDesc: "Select a habit, stake USDC. Get it back if you succeed.", noActive: "No active commitments. Create a new habit now.",
    tabActive: "active", tabCalendar: "calendar", tabContract: "contract", waitingWallet: "Waiting Wallet Approval...", verifyingBase: "Verifying on Base...", agentSaving: "", connectWallet: "Connect Wallet",
    errConn: "", errVal: "Validation failed: "
  }
};

export const originalText = lang => key => TRANSLATIONS[lang][key] || key;
export const getHabits = (t) => [
  { id: "sport", icon: <i className="bx bx-dumbbell"></i>, label: t("sport"), sub: t("sportSub"), color: "#ff6b35" },
  { id: "read", icon: <i className="bx bx-book-open"></i>, label: t("read"), sub: t("readSub"), color: "#a78bfa" },
  { id: "meditate", icon: <i className="bx bx-spa"></i>, label: t("meditate"), sub: t("meditateSub"), color: "#38bdf8" },
  { id: "nosugar", icon: <i className="bx bx-shield"></i>, label: t("nosugar"), sub: t("nosugarSub"), color: "#34d399" },
  { id: "code", icon: <i className="bx bx-code-alt"></i>, label: t("code"), sub: t("codeSub"), color: "#f472b6" },
  { id: "water", icon: <i className="bx bx-water"></i>, label: t("water"), sub: t("waterSub"), color: "#60a5fa" },
];

export const DURATIONS = [7, 14, 21, 30, 60, 90];
export const AMOUNTS = [5, 10, 25, 50, 100];
