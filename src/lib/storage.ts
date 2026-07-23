import type { AccountDef, FireProfile, MonthlyLogEntry } from "./fireCalc";
import { currentYearMonth } from "./fireCalc";

const PROFILE_KEY = "fire-roadmap:profile";
const LOG_KEY = "fire-roadmap:log";
const ACCOUNTS_KEY = "fire-roadmap:accounts";

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

export function loadLog(): MonthlyLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
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
