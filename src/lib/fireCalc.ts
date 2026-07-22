export interface FireProfile {
  currentAge: number;
  currentAssetsJpyManyen: number; // 現在の資産(日本円建て、万円単位)
  currentAssetsCny: number; // 現在の資産(人民元建て)
  cnyExchangeRate: number; // 現在の為替レート(1CNY = ?円)
  monthlySavings: number;
  annualReturnRate: number; // %
  annualExpensesAtFire: number; // 目標支出(年額)
  safeWithdrawalRate: number; // %
  startDate: string; // yyyy-mm, plan の起点
}

export interface RoadmapPoint {
  monthIndex: number;
  age: number;
  date: string; // yyyy-mm
  projectedAssets: number;
}

export interface RoadmapResult {
  fireNumber: number;
  points: RoadmapPoint[];
  fireAchieved: boolean;
  fireAchievedMonthIndex: number | null;
  fireAchievedAge: number | null;
  fireAchievedDate: string | null;
}

export interface MonthlyLogEntry {
  date: string; // yyyy-mm(月末時点の記録)
  assetsJpyManyen: number; // 日本円建て資産(万円)
  assetsCny: number; // 人民元建て資産
  exchangeRate: number; // その月末時点の為替レート(1CNY = ?円)
  memo?: string;
}

export interface LogComparison extends MonthlyLogEntry {
  monthIndex: number;
  actualAssets: number; // 円換算の合計実績
  plannedAssets: number;
  diff: number; // actual - planned
  progressRate: number; // actual / fireNumber * 100
}

const MAX_MONTHS = 60 * 12;
const MANYEN = 10_000;

export function currentAssetsTotalYen(
  profile: Pick<FireProfile, "currentAssetsJpyManyen" | "currentAssetsCny" | "cnyExchangeRate">,
): number {
  return profile.currentAssetsJpyManyen * MANYEN + profile.currentAssetsCny * profile.cnyExchangeRate;
}

export function logEntryAssetsTotalYen(
  entry: Pick<MonthlyLogEntry, "assetsJpyManyen" | "assetsCny" | "exchangeRate">,
): number {
  return entry.assetsJpyManyen * MANYEN + entry.assetsCny * entry.exchangeRate;
}

export function calculateFireNumber(
  profile: Pick<FireProfile, "annualExpensesAtFire" | "safeWithdrawalRate">,
): number {
  if (profile.safeWithdrawalRate <= 0) return 0;
  return profile.annualExpensesAtFire / (profile.safeWithdrawalRate / 100);
}

export function addMonths(yyyyMm: string, months: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function calculateRoadmap(profile: FireProfile): RoadmapResult {
  const fireNumber = calculateFireNumber(profile);
  const monthlyReturnRate = Math.pow(1 + profile.annualReturnRate / 100, 1 / 12) - 1;

  const points: RoadmapPoint[] = [];
  let assets = currentAssetsTotalYen(profile);
  let fireAchievedMonthIndex: number | null = assets >= fireNumber ? 0 : null;

  points.push({
    monthIndex: 0,
    age: profile.currentAge,
    date: profile.startDate,
    projectedAssets: Math.round(assets),
  });

  for (let m = 1; m <= MAX_MONTHS && fireAchievedMonthIndex === null; m++) {
    assets = assets * (1 + monthlyReturnRate) + profile.monthlySavings;
    points.push({
      monthIndex: m,
      age: Math.round((profile.currentAge + m / 12) * 10) / 10,
      date: addMonths(profile.startDate, m),
      projectedAssets: Math.round(assets),
    });
    if (assets >= fireNumber) {
      fireAchievedMonthIndex = m;
    }
  }

  const fireAchieved = fireAchievedMonthIndex !== null;
  const fireAchievedAge = fireAchieved
    ? Math.round((profile.currentAge + fireAchievedMonthIndex! / 12) * 10) / 10
    : null;
  const fireAchievedDate = fireAchieved ? addMonths(profile.startDate, fireAchievedMonthIndex!) : null;

  return { fireNumber, points, fireAchieved, fireAchievedMonthIndex, fireAchievedAge, fireAchievedDate };
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
        actualAssets: Math.round(actualAssets),
        plannedAssets: Math.round(planned),
        diff: Math.round(actualAssets - planned),
        progressRate: roadmap.fireNumber > 0 ? Math.round((actualAssets / roadmap.fireNumber) * 1000) / 10 : 0,
      };
    });
}
