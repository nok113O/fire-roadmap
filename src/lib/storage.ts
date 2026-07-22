import type { FireProfile, MonthlyLogEntry } from "./fireCalc";
import { currentYearMonth } from "./fireCalc";

const PROFILE_KEY = "fire-roadmap:profile";
const LOG_KEY = "fire-roadmap:log";

export const defaultProfile: FireProfile = {
  currentAge: 30,
  currentAssets: 1_000_000,
  monthlySavings: 100_000,
  annualReturnRate: 5,
  annualExpensesAtFire: 3_000_000,
  safeWithdrawalRate: 4,
  startDate: currentYearMonth(),
};

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
