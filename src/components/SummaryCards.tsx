import type { RoadmapResult } from "../lib/fireCalc";
import { formatYearMonth, formatYenCompact } from "../lib/format";

interface Props {
  roadmap: RoadmapResult;
  currentAge: number;
}

export function SummaryCards({ roadmap, currentAge }: Props) {
  const yearsToFire = roadmap.fireAchievedAge != null ? (roadmap.fireAchievedAge - currentAge).toFixed(1) : null;

  return (
    <section className="summary-grid">
      <div className="summary-card">
        <span className="summary-label">FIRE必要資産額</span>
        <span className="summary-value">{formatYenCompact(roadmap.fireNumber)}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">FIRE達成予定</span>
        <span className="summary-value">
          {roadmap.fireAchieved && roadmap.fireAchievedDate
            ? formatYearMonth(roadmap.fireAchievedDate)
            : "60年以内に未達成"}
        </span>
      </div>
      <div className="summary-card">
        <span className="summary-label">達成予定年齢</span>
        <span className="summary-value">
          {roadmap.fireAchievedAge != null ? `${roadmap.fireAchievedAge}歳` : "—"}
        </span>
      </div>
      <div className="summary-card">
        <span className="summary-label">残り期間</span>
        <span className="summary-value">{yearsToFire != null ? `あと${yearsToFire}年` : "—"}</span>
      </div>
    </section>
  );
}
