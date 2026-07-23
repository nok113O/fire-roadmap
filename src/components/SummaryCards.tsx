import { useState } from "react";
import type { FireGoalResult, FireProfile, RoadmapResult } from "../lib/fireCalc";
import { calculateRequiredMonthlySavings, currentAssetsTotalYen } from "../lib/fireCalc";
import { formatYearMonth, formatYen, formatYenCompact } from "../lib/format";

interface Props {
  roadmap: RoadmapResult;
  profile: FireProfile;
}

function GoalSummary({ label, goal, profile }: { label: string; goal: FireGoalResult; profile: FireProfile }) {
  const [targetAge, setTargetAge] = useState("");

  const yearsToGoal = goal.achievedAge != null ? (goal.achievedAge - profile.currentAge).toFixed(1) : null;

  const targetAgeNum = Number(targetAge);
  const hasValidTargetAge = targetAge.trim() !== "" && !Number.isNaN(targetAgeNum);
  const months = hasValidTargetAge ? Math.round((targetAgeNum - profile.currentAge) * 12) : null;
  const requiredMonthlySavings =
    months != null && months > 0
      ? calculateRequiredMonthlySavings(
          currentAssetsTotalYen(profile),
          goal.requiredAssets,
          profile.annualReturnRate,
          months,
        )
      : null;

  return (
    <div className="summary-goal">
      <h3>{label}</h3>
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">必要資産額</span>
          <span className="summary-value">{formatYenCompact(goal.requiredAssets)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">達成予定</span>
          <span className="summary-value">
            {goal.achieved && goal.achievedDate ? formatYearMonth(goal.achievedDate) : "60年以内に未達成"}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">達成予定年齢</span>
          <span className="summary-value">{goal.achievedAge != null ? `${goal.achievedAge}歳` : "—"}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">残り期間</span>
          <span className="summary-value">{yearsToGoal != null ? `あと${yearsToGoal}年` : "—"}</span>
        </div>
      </div>

      <div className="reverse-calc">
        <label className="form-field">
          <span className="form-label">目標年齢から必要積立額を逆算</span>
          <div className="form-input-wrap">
            <input
              type="number"
              step={0.5}
              placeholder="例: 45"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
            />
            <span className="form-suffix">歳</span>
          </div>
        </label>
        {months != null && months <= 0 && (
          <p className="reverse-calc-result">現在の年齢より後の年齢を指定してください</p>
        )}
        {requiredMonthlySavings != null &&
          (requiredMonthlySavings <= 0 ? (
            <p className="reverse-calc-result">
              {targetAgeNum}歳の時点では、追加の積立をしなくても目標資産に到達見込みです
            </p>
          ) : (
            <p className="reverse-calc-result">
              {targetAgeNum}歳までに達成するには、毎月{formatYen(requiredMonthlySavings)}の積立が必要です(現在の設定:
              毎月{formatYen(profile.monthlySavings)}
              {requiredMonthlySavings > profile.monthlySavings
                ? `、あと毎月${formatYen(requiredMonthlySavings - profile.monthlySavings)}の上積みが必要です`
                : "、現在の設定で達成可能です"}
              )
            </p>
          ))}
      </div>
    </div>
  );
}

export function SummaryCards({ roadmap, profile }: Props) {
  return (
    <section className="card">
      <GoalSummary label="セミFIRE" goal={roadmap.semiFire} profile={profile} />
      <GoalSummary label="完全FIRE" goal={roadmap.fullFire} profile={profile} />
    </section>
  );
}
