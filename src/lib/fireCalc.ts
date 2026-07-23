import { addMonths, currentYearMonth, monthsBetween } from "./dateUtils";
import type { LifeEvent } from "./familyPlan";
import { monthlyLifeEventDeltaYen } from "./familyPlan";

export { addMonths, currentYearMonth, monthsBetween };

export interface FireProfile {
  currentAge: number;
  currentAssetsJpyManyen: number; // 現在の資産(日本円建て、万円単位)
  currentAssetsCny: number; // 現在の資産(人民元建て)
  cnyExchangeRate: number; // 現在の為替レート(1CNY = ?円)
  monthlySavings: number;
  annualReturnRate: number; // %
  startDate: string; // yyyy-mm, plan の起点

  semiFireAnnualExpenses: number; // セミFIRE後の年間支出(円)
  semiFireSafeWithdrawalRate: number; // セミFIREの安全引出率(%)
  semiFirePartTimeIncome: number; // セミFIRE後の就労収入(円/年)

  fullFireAnnualExpenses: number; // 完全FIRE後の年間支出(円)
  fullFireSafeWithdrawalRate: number; // 完全FIREの安全引出率(%)
}

export interface RoadmapPoint {
  monthIndex: number;
  age: number;
  date: string; // yyyy-mm
  projectedAssets: number;
}

export interface FireGoalResult {
  requiredAssets: number;
  achieved: boolean;
  achievedMonthIndex: number | null;
  achievedAge: number | null;
  achievedDate: string | null;
}

export interface RoadmapResult {
  points: RoadmapPoint[];
  semiFire: FireGoalResult;
  fullFire: FireGoalResult;
}

export interface AccountDef {
  id: string;
  name: string;
}

export interface MonthlyLogEntry {
  date: string; // yyyy-mm(月末時点の記録)
  jpyAccountBalances: Record<string, number>; // 口座id -> 万円
  jpyIncome: number; // 万円/月
  jpyExpense: number; // 万円/月
  cnyAssets: number; // 人民元建て資産
  cnyIncome: number; // 元/月
  cnyExpense: number; // 元/月
  exchangeRate: number; // その月末時点の為替レート(1CNY = ?円)
  memo?: string;
}

export interface LogComparison extends MonthlyLogEntry {
  monthIndex: number;
  jpyAssetsManyen: number;
  jpySavingsRate: number; // %
  cnySavingsRate: number; // %
  actualAssets: number; // 円換算の合計実績
  plannedAssets: number;
  diff: number; // actual - planned
  progressRate: number; // actual / 完全FIRE必要資産額 * 100
}

const MAX_MONTHS = 60 * 12;
const MANYEN = 10_000;

export function currentAssetsTotalYen(
  profile: Pick<FireProfile, "currentAssetsJpyManyen" | "currentAssetsCny" | "cnyExchangeRate">,
): number {
  return profile.currentAssetsJpyManyen * MANYEN + profile.currentAssetsCny * profile.cnyExchangeRate;
}

export function sumJpyAccountBalances(balances: Record<string, number> | undefined): number {
  if (!balances) return 0;
  return Object.values(balances).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
}

export function savingsRatePercent(income: number, expense: number): number {
  if (income <= 0) return 0;
  return Math.round(((income - expense) / income) * 1000) / 10;
}

export function logEntryAssetsTotalYen(
  entry: Pick<MonthlyLogEntry, "jpyAccountBalances" | "cnyAssets" | "exchangeRate">,
): number {
  return sumJpyAccountBalances(entry.jpyAccountBalances) * MANYEN + entry.cnyAssets * entry.exchangeRate;
}

export function calculateRequiredAssets(annualExpenses: number, safeWithdrawalRate: number, partTimeIncome = 0): number {
  if (safeWithdrawalRate <= 0) return 0;
  const netAnnualNeed = Math.max(0, annualExpenses - partTimeIncome);
  return netAnnualNeed / (safeWithdrawalRate / 100);
}

function buildGoalResult(
  profile: FireProfile,
  requiredAssets: number,
  achievedMonthIndex: number | null,
): FireGoalResult {
  const achieved = achievedMonthIndex !== null;
  return {
    requiredAssets,
    achieved,
    achievedMonthIndex,
    achievedAge: achieved ? Math.round((profile.currentAge + achievedMonthIndex! / 12) * 10) / 10 : null,
    achievedDate: achieved ? addMonths(profile.startDate, achievedMonthIndex!) : null,
  };
}

export function calculateRoadmap(profile: FireProfile, lifeEvents: LifeEvent[] = []): RoadmapResult {
  const semiRequired = calculateRequiredAssets(
    profile.semiFireAnnualExpenses,
    profile.semiFireSafeWithdrawalRate,
    profile.semiFirePartTimeIncome,
  );
  const fullRequired = calculateRequiredAssets(profile.fullFireAnnualExpenses, profile.fullFireSafeWithdrawalRate);
  const monthlyReturnRate = Math.pow(1 + profile.annualReturnRate / 100, 1 / 12) - 1;

  const points: RoadmapPoint[] = [];
  let assets = currentAssetsTotalYen(profile);
  let semiAchievedMonthIndex: number | null = assets >= semiRequired ? 0 : null;
  let fullAchievedMonthIndex: number | null = assets >= fullRequired ? 0 : null;

  points.push({
    monthIndex: 0,
    age: profile.currentAge,
    date: profile.startDate,
    projectedAssets: Math.round(assets),
  });

  for (
    let m = 1;
    m <= MAX_MONTHS && (semiAchievedMonthIndex === null || fullAchievedMonthIndex === null);
    m++
  ) {
    const date = addMonths(profile.startDate, m);
    assets = assets * (1 + monthlyReturnRate) + profile.monthlySavings + monthlyLifeEventDeltaYen(lifeEvents, date);
    points.push({
      monthIndex: m,
      age: Math.round((profile.currentAge + m / 12) * 10) / 10,
      date,
      projectedAssets: Math.round(assets),
    });
    if (semiAchievedMonthIndex === null && assets >= semiRequired) {
      semiAchievedMonthIndex = m;
    }
    if (fullAchievedMonthIndex === null && assets >= fullRequired) {
      fullAchievedMonthIndex = m;
    }
  }

  return {
    points,
    semiFire: buildGoalResult(profile, semiRequired, semiAchievedMonthIndex),
    fullFire: buildGoalResult(profile, fullRequired, fullAchievedMonthIndex),
  };
}

function plannedAssetsAt(roadmap: RoadmapResult, monthIndex: number): number {
  if (roadmap.points.length === 0) return 0;
  if (monthIndex <= 0) return roadmap.points[0].projectedAssets;
  const last = roadmap.points[roadmap.points.length - 1];
  if (monthIndex >= last.monthIndex) return last.projectedAssets;
  return roadmap.points[monthIndex]?.projectedAssets ?? last.projectedAssets;
}

export function compareLogWithPlan(
  profile: FireProfile,
  roadmap: RoadmapResult,
  log: MonthlyLogEntry[],
): LogComparison[] {
  return log
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const monthIndex = monthsBetween(profile.startDate, entry.date);
      const planned = plannedAssetsAt(roadmap, monthIndex);
      const actualAssets = logEntryAssetsTotalYen(entry);
      return {
        ...entry,
        monthIndex,
        jpyAssetsManyen: sumJpyAccountBalances(entry.jpyAccountBalances),
        jpySavingsRate: savingsRatePercent(entry.jpyIncome, entry.jpyExpense),
        cnySavingsRate: savingsRatePercent(entry.cnyIncome, entry.cnyExpense),
        actualAssets: Math.round(actualAssets),
        plannedAssets: Math.round(planned),
        diff: Math.round(actualAssets - planned),
        progressRate:
          roadmap.fullFire.requiredAssets > 0
            ? Math.round((actualAssets / roadmap.fullFire.requiredAssets) * 1000) / 10
            : 0,
      };
    });
}
