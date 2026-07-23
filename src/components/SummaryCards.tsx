import type { FireGoalResult, RoadmapResult } from "../lib/fireCalc";
import { formatYearMonth, formatYenCompact } from "../lib/format";

interface Props {
  roadmap: RoadmapResult;
  currentAge: number;
}

function GoalSummary({ label, goal, currentAge }: { label: string; goal: FireGoalResult; currentAge: number }) {
  const yearsToGoal = goal.achievedAge != null ? (goal.achievedAge - currentAge).toFixed(1) : null;

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
    </div>
  );
}

export function SummaryCards({ roadmap, currentAge }: Props) {
  return (
    <section className="card">
      <GoalSummary label="セミFIRE" goal={roadmap.semiFire} currentAge={currentAge} />
      <GoalSummary label="完全FIRE" goal={roadmap.fullFire} currentAge={currentAge} />
    </section>
  );
}
