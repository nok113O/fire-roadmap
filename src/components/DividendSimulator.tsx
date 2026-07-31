import { useState } from "react";
import type { DividendPlan } from "../lib/dividendCalc";
import { calculateDividendProjection, findYearReachingDividendTarget } from "../lib/dividendCalc";
import { formatManyen, formatYearMonth } from "../lib/format";
import { CommaNumberInput } from "./CommaNumberInput";

interface Props {
  plan: DividendPlan;
  onChange: (plan: DividendPlan) => void;
}

export function DividendSimulator({ plan, onChange }: Props) {
  const [targetManyen, setTargetManyen] = useState("240");

  const update = (patch: Partial<DividendPlan>) => onChange({ ...plan, ...patch });

  const points = calculateDividendProjection(plan);
  const targetNum = Number(targetManyen) || 0;
  const targetPoint = findYearReachingDividendTarget(points, targetNum);

  return (
    <section className="card">
      <h2>配当金シミュレーション</h2>
      <p className="form-total-hint">
        NISA成長投資枠などを使った増配株投資を想定し、投資した年ごとの元本が複利で配当を増やしていく前提でシミュレーションします。この配当収入は、起点月(今)時点の想定配当額を使って、セミFIRE・完全FIREの必要資産額から差し引く追加収入として計算に反映されます(配当を生む元本自体は「現在の資産」として通常通り計算されるため、二重計上にはなりません)。配当開始前は差し引かれる金額は0円になり、支出などの入力を変えても必要資産額の配当分は変わりません。なお配当成長は「配当成長の上限年数」で頭打ちにし、非現実的な際限のない複利成長を防いでいます。
      </p>

      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">年間投資額</span>
          <div className="form-input-wrap">
            <CommaNumberInput
              value={String(plan.annualInvestmentManyen)}
              onChange={(raw) => update({ annualInvestmentManyen: raw === "" || raw === "-" ? 0 : Number(raw) })}
            />
            <span className="form-suffix">万円/年</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">投資を続ける年数</span>
          <div className="form-input-wrap">
            <input
              type="number"
              value={plan.investmentYears}
              onChange={(e) => update({ investmentYears: Number(e.target.value) || 0 })}
            />
            <span className="form-suffix">年</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">初期配当利回り</span>
          <div className="form-input-wrap">
            <input
              type="number"
              step={0.1}
              value={plan.dividendYieldPercent}
              onChange={(e) => update({ dividendYieldPercent: Number(e.target.value) || 0 })}
            />
            <span className="form-suffix">%</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">配当の年間成長率</span>
          <div className="form-input-wrap">
            <input
              type="number"
              step={0.1}
              value={plan.dividendGrowthRatePercent}
              onChange={(e) => update({ dividendGrowthRatePercent: Number(e.target.value) || 0 })}
            />
            <span className="form-suffix">%</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">配当成長の上限年数</span>
          <div className="form-input-wrap">
            <input
              type="number"
              value={plan.dividendGrowthCapYears}
              onChange={(e) => update({ dividendGrowthCapYears: Number(e.target.value) || 0 })}
            />
            <span className="form-suffix">年</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">投資開始月</span>
          <div className="form-input-wrap">
            <input type="month" value={plan.startDate} onChange={(e) => update({ startDate: e.target.value })} />
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">目標の年間配当額</span>
          <div className="form-input-wrap">
            <CommaNumberInput value={targetManyen} onChange={setTargetManyen} />
            <span className="form-suffix">万円/年</span>
          </div>
        </label>
      </div>

      <p className="form-total-hint">
        {targetPoint
          ? `目標(${formatManyen(targetNum)}/年)到達予定: ${formatYearMonth(targetPoint.date)}(投資開始から${targetPoint.year}年目)`
          : `30年以内に目標(${formatManyen(targetNum)}/年)には到達しない見込みです`}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>年月</th>
              <th>経過年数</th>
              <th>想定年間配当額</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.year}>
                <td>{formatYearMonth(p.date)}</td>
                <td>{p.year}年目</td>
                <td className={targetPoint && p.year === targetPoint.year ? "diff-positive" : undefined}>
                  {formatManyen(p.annualDividendManyen)}/年
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
