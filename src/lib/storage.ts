import type { AccountDef, FireProfile, MonthlyLogEntry } from "./fireCalc";
import { currentYearMonth } from "./fireCalc";
import type { FamilyMember, LifeEvent, LifeEventPreset } from "./familyPlan";
import { defaultLifeEventPresets } from "./familyPlan";

const PROFILE_KEY = "fire-roadmap:profile";
const LOG_KEY = "fire-roadmap:log";
const ACCOUNTS_KEY = "fire-roadmap:accounts";
const FAMILY_KEY = "fire-roadmap:family";
const LIFE_EVENTS_KEY = "fire-roadmap:lifeEvents";
const EVENT_PRESETS_KEY = "fire-roadmap:eventPresets";

export const defaultProfile: FireProfile = {
  currentAge: 30,
  currentAssetsJpyManyen: 100,
  currentAssetsCny: 0,
  cnyExchangeRate: 20,
  monthlySavings: 100_000,
  annualReturnRate: 5,
  annualExpensesAtFire: 3_000_000,
  safeWithdrawalRate: 4,
  startDate: currentYearMonth(),
};

export const defaultAccounts: AccountDef[] = [
  { id: "mufj", name: "三菱UFJ" },
  { id: "rakuten", name: "楽天" },
  { id: "sony", name: "ソニー銀行" },
  { id: "yucho", name: "ゆうちょ銀行" },
  { id: "dc", name: "企業型確定拠出年金" },
  { id: "smbc", name: "三井住友銀行" },
  { id: "sbishinsei", name: "SBI新生銀行" },
  { id: "cash", name: "現金" },
];

export function loadProfile(): FireProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: FireProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

const LEGACY_ACCOUNT_ID = "_legacy";

// 口座別残高(jpyAccountBalances)導入前の旧形式データを新形式に変換する
function normalizeLogEntry(raw: Record<string, unknown>): MonthlyLogEntry {
  const jpyAccountBalances =
    raw.jpyAccountBalances && typeof raw.jpyAccountBalances === "object"
      ? (raw.jpyAccountBalances as Record<string, number>)
      : typeof raw.assetsJpyManyen === "number"
        ? { [LEGACY_ACCOUNT_ID]: raw.assetsJpyManyen }
        : {};

  return {
    date: String(raw.date ?? ""),
    jpyAccountBalances,
    jpyIncome: typeof raw.jpyIncome === "number" ? raw.jpyIncome : 0,
    jpyExpense: typeof raw.jpyExpense === "number" ? raw.jpyExpense : 0,
    cnyAssets: typeof raw.cnyAssets === "number" ? raw.cnyAssets : typeof raw.assetsCny === "number" ? raw.assetsCny : 0,
    cnyIncome: typeof raw.cnyIncome === "number" ? raw.cnyIncome : 0,
    cnyExpense: typeof raw.cnyExpense === "number" ? raw.cnyExpense : 0,
    exchangeRate: typeof raw.exchangeRate === "number" ? raw.exchangeRate : 0,
    memo: typeof raw.memo === "string" ? raw.memo : undefined,
  };
}

export function loadLog(): MonthlyLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLogEntry);
  } catch {
    return [];
  }
}

export function saveLog(log: MonthlyLogEntry[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function loadAccounts(): AccountDef[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return defaultAccounts;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultAccounts;
  } catch {
    return defaultAccounts;
  }
}

export function saveAccounts(accounts: AccountDef[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadFamilyMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFamilyMembers(members: FamilyMember[]): void {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(members));
}

export function loadLifeEvents(): LifeEvent[] {
  try {
    const raw = localStorage.getItem(LIFE_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLifeEvents(events: LifeEvent[]): void {
  localStorage.setItem(LIFE_EVENTS_KEY, JSON.stringify(events));
}

export function loadLifeEventPresets(): LifeEventPreset[] {
  try {
    const raw = localStorage.getItem(EVENT_PRESETS_KEY);
    if (!raw) return defaultLifeEventPresets;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultLifeEventPresets;
  } catch {
    return defaultLifeEventPresets;
  }
}

export function saveLifeEventPresets(presets: LifeEventPreset[]): void {
  localStorage.setItem(EVENT_PRESETS_KEY, JSON.stringify(presets));
}
