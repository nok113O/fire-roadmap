import { addMonths, monthsBetween } from "./dateUtils";

export interface DividendPlan {
  annualInvestmentManyen: number; // 年間投資額(万円)。NISA成長投資枠なら上限240万円/年
  investmentYears: number; // 投資を続ける年数(この年数分、毎年積み立てる)
  dividendYieldPercent: number; // 投資した年の初期配当利回り(%)
  dividendGrowthRatePercent: number; // 配当の年間成長率(%)。増配株投資の前提
  startDate: string; // yyyy-mm, 投資開始月
}

export interface DividendYearPoint {
  year: number; // startDateからの経過年数
  date: string; // yyyy-mm
  annualDividendManyen: number;
}

const PROJECTION_YEARS = 30;

// 年ごとに投資した元本(年間投資額)が、その年から複利で配当を増やしていく前提でシミュレーションする。
// 例: 1年目に投資した分は、初期利回り×(1+成長率)^経過年数の配当を生み続ける。
export function calculateDividendProjection(plan: DividendPlan): DividendYearPoint[] {
  const points: DividendYearPoint[] = [];
  for (let year = 0; year <= PROJECTION_YEARS; year++) {
    let total = 0;
    const tranchesInvested = Math.min(year + 1, Math.max(plan.investmentYears, 0));
    for (let k = 0; k < tranchesInvested; k++) {
      const yearsSinceTranche = year - k;
      const baseDividend = plan.annualInvestmentManyen * (plan.dividendYieldPercent / 100);
      total += baseDividend * Math.pow(1 + plan.dividendGrowthRatePercent / 100, yearsSinceTranche);
    }
    points.push({
      year,
      date: addMonths(plan.startDate, year * 12),
      annualDividendManyen: Math.round(total * 10) / 10,
    });
  }
  return points;
}

// 任意の年月時点での想定年間配当額(万円)を計算する。ロードマップ計算に組み込むために使用。
export function getAnnualDividendManyenAt(plan: DividendPlan, date: string): number {
  const yearsSinceStart = monthsBetween(plan.startDate, date) / 12;
  if (yearsSinceStart < 0) return 0;
  let total = 0;
  for (let k = 0; k < Math.max(plan.investmentYears, 0); k++) {
    const yearsSinceTranche = yearsSinceStart - k;
    if (yearsSinceTranche < 0) continue;
    const baseDividend = plan.annualInvestmentManyen * (plan.dividendYieldPercent / 100);
    total += baseDividend * Math.pow(1 + plan.dividendGrowthRatePercent / 100, yearsSinceTranche);
  }
  return total;
}

// 目標の年間配当額に初めて到達する年のポイントを返す(到達しなければnull)
export function findYearReachingDividendTarget(
  points: DividendYearPoint[],
  targetManyen: number,
): DividendYearPoint | null {
  if (targetManyen <= 0) return points[0] ?? null;
  return points.find((p) => p.annualDividendManyen >= targetManyen) ?? null;
}
