import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyLogEntry, RoadmapResult } from "../lib/fireCalc";
import { logEntryAssetsTotalYen } from "../lib/fireCalc";
import { formatYearMonth, formatYenCompact } from "../lib/format";

interface Props {
  roadmap: RoadmapResult;
  log: MonthlyLogEntry[];
  excludedAccountIds?: Set<string>;
}

interface ChartPoint {
  date: string;
  planned?: number;
  actual?: number;
}

export function RoadmapChart({ roadmap, log, excludedAccountIds }: Props) {
  const chartData: ChartPoint[] = roadmap.points.map((p) => ({
    date: p.date,
    planned: p.projectedAssets,
  }));

  const byDate = new Map(chartData.map((d) => [d.date, d]));
  for (const entry of log) {
    const point = byDate.get(entry.date);
    const actual = logEntryAssetsTotalYen(entry, excludedAccountIds);
    if (point) {
      point.actual = actual;
    } else {
      const newPoint: ChartPoint = { date: entry.date, actual };
      chartData.push(newPoint);
      byDate.set(entry.date, newPoint);
    }
  }
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="card">
      <h2>資産推移ロードマップ</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(d: string) => formatYearMonth(d)} minTickGap={40} />
            <YAxis tickFormatter={(v: number) => formatYenCompact(v)} width={90} />
            <Tooltip
              formatter={(value, name) => [
                formatYenCompact(Number(value)),
                name === "planned" ? "計画" : "実績",
              ]}
              labelFormatter={(label) => formatYearMonth(label as string)}
            />
            <Legend formatter={(value) => (value === "planned" ? "計画" : "実績")} />
            <ReferenceLine
              y={roadmap.semiFire.requiredAssets}
              stroke="#059669"
              strokeDasharray="4 4"
              label={{ value: "セミFIRE", position: "insideTopLeft", fill: "#059669", fontSize: 12 }}
            />
            <ReferenceLine
              y={roadmap.fullFire.requiredAssets}
              stroke="#a855f7"
              strokeDasharray="4 4"
              label={{ value: "完全FIRE", position: "insideTopLeft", fill: "#a855f7", fontSize: 12 }}
            />
            <Line type="monotone" dataKey="planned" stroke="#2563eb" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
