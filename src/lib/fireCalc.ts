import { addMonths, currentYearMonth, monthsBetween } from "./dateUtils";
import type { DividendPlan } from "./dividendCalc";
import { getAnnualDividendManyenAt } from "./dividendCalc";
import type { LifeEvent } from "./familyPlan";
import { monthlyLifeEventDeltaYen } from "./familyPlan";

export { addMonths, currentYearMonth, monthsBetween };

export interface FireProfile {
  currentAge: number;
  currentAssetsJpyManyen: number; // 現在の資産(日本円建て、万円単位)
  currentAssetsCny: number; // 現在の資産(人民元建て)
  cnyExchangeRate: number; // 現在の為替レート(1CNY = ?円)
  monthlySavings: number;
  savingsGrowthRate?: number; // %/年、昇給などによる毎月の貯蓄額の年間成長率(未設定なら成長なし)
  annualReturnRate: number; // %
  investmentStartDate?: string; // yyyy-mm, この月より前は運用リターンを0%として計算する(未設定なら常に運用している前提)
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
  dividendIncomeYen: number; // 必要資産額の計算時に差し引いた想定年間配当額(円)
}

export interface RoadmapResult {
  points: RoadmapPoint[];
  semiFire: FireGoalResult;
  fullFire: FireGoalResult;
}

export interface AccountDef {
  id: string;
  name: string;
  excludeFromTotal?: boolean; // 子供名義の口座など、FIRE計算の合計から除外したい場合にtrue
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
  // 計画の起点月より前の記録は比較対象となる予測値が存在しないため、いずれもnullになる
  plannedAssets: number | null;
  diff: number | null; // actual - planned
  progressRate: number | null; // actual / 完全FIRE必要資産額 * 100
}

const MAX_MONTHS = 60 * 12;
const MANYEN = 10_000;

export function currentAssetsTotalYen(
  profile: Pick<FireProfile, "currentAssetsJpyManyen" | "currentAssetsCny" | "cnyExchangeRate">,
): number {
  return profile.currentAssetsJpyManyen * MANYEN + profile.currentAssetsCny * profile.cnyExchangeRate;
}

export function sumJpyAccountBalances(
  balances: Record<string, number> | undefined,
  excludedAccountIds?: Set<string>,
): number {
  if (!balances) return 0;
  return Object.entries(balances).reduce((sum, [accountId, v]) => {
    if (excludedAccountIds?.has(accountId)) return sum;
    return sum + (typeof v === "number" ? v : 0);
  }, 0);
}

export interface LatestLogSnapshot {
  date: string; // yyyy-mm
  jpyManyen: number;
  cny: number;
  exchangeRate: number;
}

function toSnapshot(entry: MonthlyLogEntry, excludedAccountIds?: Set<string>): LatestLogSnapshot {
  return {
    date: entry.date,
    jpyManyen: sumJpyAccountBalances(entry.jpyAccountBalances, excludedAccountIds),
    cny: entry.cnyAssets,
    exchangeRate: entry.exchangeRate,
  };
}

// 記録済みの実績のうち最新月のものを、現在の資産の代わりに使うためのスナップショットとして返す
export function latestLogSnapshot(
  log: MonthlyLogEntry[],
  excludedAccountIds?: Set<string>,
): LatestLogSnapshot | null {
  if (log.length === 0) return null;
  const latest = log.slice().sort((a, b) => a.date.localeCompare(b.date))[log.length - 1];
  return toSnapshot(latest, excludedAccountIds);
}


export function savingsRatePercent(income: number, expense: number): number {
  if (income <= 0) return 0;
  return Math.round(((income - expense) / income) * 1000) / 10;
}

export function logEntryAssetsTotalYen(
  entry: Pick<MonthlyLogEntry, "jpyAccountBalances" | "cnyAssets" | "exchangeRate">,
  excludedAccountIds?: Set<string>,
): number {
  return sumJpyAccountBalances(entry.jpyAccountBalances, excludedAccountIds) * MANYEN + entry.cnyAssets * entry.exchangeRate;
}

export interface EstimatedMonthlySavings {
  monthlySavingsYen: number;
  monthsUsed: number;
  fromDate: string;
  toDate: string;
}

// 直近windowMonths分の実績記録から、資産総額の増減を月数で割って平均貯蓄額を逆算する
// (投資リターンや為替レートの変動も混ざった実績ベースの概算値であることに注意)
export function estimateMonthlySavingsFromLog(
  log: MonthlyLogEntry[],
  windowMonths: number,
  excludedAccountIds?: Set<string>,
): EstimatedMonthlySavings | null {
  const sorted = log.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const cutoff = addMonths(latest.date, -windowMonths);
  const windowed = sorted.filter((entry) => entry.date >= cutoff);
  const base = windowed.length >= 2 ? windowed : sorted;

  const first = base[0];
  const last = base[base.length - 1];
  const months = monthsBetween(first.date, last.date);
  if (months <= 0) return null;

  const deltaYen = logEntryAssetsTotalYen(last, excludedAccountIds) - logEntryAssetsTotalYen(first, excludedAccountIds);
  return {
    monthlySavingsYen: deltaYen / months,
    monthsUsed: months,
    fromDate: first.date,
    toDate: last.date,
  };
}

export function calculateRequiredAssets(annualExpenses: number, safeWithdrawalRate: number, partTimeIncome = 0): number {
  if (safeWithdrawalRate <= 0) return 0;
  const netAnnualNeed = Math.max(0, annualExpenses - partTimeIncome);
  return netAnnualNeed / (safeWithdrawalRate / 100);
}

// 目標資産額に、指定した月数以内で到達するために必要な毎月積立額を逆算する
// 目標資産額 = 現在資産×(1+月利)^月数 + 毎月積立額×{(1+月利)^月数-1}/月利 の式をPMTについて解く
export function calculateRequiredMonthlySavings(
  currentAssets: number,
  requiredAssets: number,
  annualReturnRate: number,
  months: number,
): number {
  if (months <= 0) return requiredAssets > currentAssets ? Infinity : 0;
  const monthlyReturnRate = Math.pow(1 + annualReturnRate / 100, 1 / 12) - 1;
  const futureValueOfCurrent = currentAssets * Math.pow(1 + monthlyReturnRate, months);
  const shortfall = requiredAssets - futureValueOfCurrent;
  if (shortfall <= 0) return 0;
  if (monthlyReturnRate === 0) return shortfall / months;
  const annuityFactor = (Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate;
  return shortfall / annuityFactor;
}

function buildGoalResult(
  profile: FireProfile,
  requiredAssets: number,
  achievedMonthIndex: number | null,
  dividendIncomeYen: number,
): FireGoalResult {
  const achieved = achievedMonthIndex !== null;
  return {
    requiredAssets,
    achieved,
    achievedMonthIndex,
    achievedAge: achieved ? Math.round((profile.currentAge + achievedMonthIndex! / 12) * 10) / 10 : null,
    achievedDate: achieved ? addMonths(profile.startDate, achievedMonthIndex!) : null,
    dividendIncomeYen,
  };
}

// 一度必要資産額に到達しても、将来の大きな支出(教育費など)で再び下回ることがあるため、
// 「その月以降シミュレーション期間の終わりまでずっと必要資産額を維持できる」最初の月を達成とみなす。
// 配当収入を考慮する場合、必要資産額は月によって変わりうるため、固定値ではなく関数として受け取る。
function findSustainedAchievedMonthIndex(
  points: RoadmapPoint[],
  requiredAssetsAt: (index: number) => number,
): number | null {
  let lastBelowIndex = -1;
  for (let i = 0; i < points.length; i++) {
    if (points[i].projectedAssets < requiredAssetsAt(i)) lastBelowIndex = i;
  }
  const sustainedIndex = lastBelowIndex + 1;
  return sustainedIndex < points.length ? sustainedIndex : null;
}

export function calculateRoadmap(
  profile: FireProfile,
  lifeEvents: LifeEvent[] = [],
  dividendPlan?: DividendPlan,
): RoadmapResult {
  const monthlyReturnRate = Math.pow(1 + profile.annualReturnRate / 100, 1 / 12) - 1;

  const points: RoadmapPoint[] = [];
  let assets = currentAssetsTotalYen(profile);

  points.push({
    monthIndex: 0,
    age: profile.currentAge,
    date: profile.startDate,
    projectedAssets: Math.round(assets),
  });

  for (let m = 1; m <= MAX_MONTHS; m++) {
    const date = addMonths(profile.startDate, m);
    const isInvesting = !profile.investmentStartDate || date >= profile.investmentStartDate;
    const effectiveMonthlyReturnRate = isInvesting ? monthlyReturnRate : 0;
    const savingsGrowthFactor = Math.pow(1 + (profile.savingsGrowthRate ?? 0) / 100, m / 12);
    const effectiveMonthlySavings = profile.monthlySavings * savingsGrowthFactor;
    assets = assets * (1 + effectiveMonthlyReturnRate) + effectiveMonthlySavings + monthlyLifeEventDeltaYen(lifeEvents, date);
    points.push({
      monthIndex: m,
      age: Math.round((profile.currentAge + m / 12) * 10) / 10,
      date,
      projectedAssets: Math.round(assets),
    });
  }

  // 配当収入(NISA増配株投資などの想定)を、就労収入と同様に必要資産額から差し引く追加収入として扱う。
  // 配当を生む元本自体はすでに「現在の資産」に含まれ通常通り複利成長するため、配当額を資産側には加算しない(二重計上防止)。
  const dividendYenAt = (date: string): number =>
    dividendPlan ? getAnnualDividendManyenAt(dividendPlan, date) * MANYEN : 0;

  const semiRequiredAt = (date: string) =>
    calculateRequiredAssets(
      profile.semiFireAnnualExpenses,
      profile.semiFireSafeWithdrawalRate,
      profile.semiFirePartTimeIncome + dividendYenAt(date),
    );
  const fullRequiredAt = (date: string) =>
    calculateRequiredAssets(profile.fullFireAnnualExpenses, profile.fullFireSafeWithdrawalRate, dividendYenAt(date));

  // 達成判定そのものは、暦の上で配当が実際に育っていく前提を正しく反映するため、月ごとに変わる閾値を使う。
  const semiAchievedMonthIndex = findSustainedAchievedMonthIndex(points, (i) => semiRequiredAt(points[i].date));
  const fullAchievedMonthIndex = findSustainedAchievedMonthIndex(points, (i) => fullRequiredAt(points[i].date));

  // 表示する必要資産額は、達成予定日ではなく起点月(今)時点の配当収入で固定する。
  // 達成予定日を基準にすると、支出を増やして達成が遅れるほど配当がその分余計に複利成長した扱いになり、
  // 「支出を増やすほど必要資産額が下がって見える」という不自然な結果になるため。
  const semiRequiredDisplay = semiRequiredAt(profile.startDate);
  const fullRequiredDisplay = fullRequiredAt(profile.startDate);

  return {
    points,
    semiFire: buildGoalResult(profile, semiRequiredDisplay, semiAchievedMonthIndex, dividendYenAt(profile.startDate)),
    fullFire: buildGoalResult(profile, fullRequiredDisplay, fullAchievedMonthIndex, dividendYenAt(profile.startDate)),
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
  excludedAccountIds?: Set<string>,
): LogComparison[] {
  return log
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const monthIndex = monthsBetween(profile.startDate, entry.date);
      // 計画の起点月より前は、比較対象となる予測値がそもそも存在しない
      const hasPlan = monthIndex >= 0;
      const planned = hasPlan ? plannedAssetsAt(roadmap, monthIndex) : null;
      const actualAssets = logEntryAssetsTotalYen(entry, excludedAccountIds);
      return {
        ...entry,
        monthIndex,
        jpyAssetsManyen: sumJpyAccountBalances(entry.jpyAccountBalances, excludedAccountIds),
        jpySavingsRate: savingsRatePercent(entry.jpyIncome, entry.jpyExpense),
        cnySavingsRate: savingsRatePercent(entry.cnyIncome, entry.cnyExpense),
        actualAssets: Math.round(actualAssets),
        plannedAssets: planned != null ? Math.round(planned) : null,
        diff: planned != null ? Math.round(actualAssets - planned) : null,
        progressRate:
          roadmap.fullFire.requiredAssets > 0
            ? Math.round((actualAssets / roadmap.fullFire.requiredAssets) * 1000) / 10
            : 0,
      };
    });
}
