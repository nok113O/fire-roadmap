import { useState } from "react";
import type { FireProfile, MonthlyLogEntry, RoadmapResult } from "../lib/fireCalc";
import { compareLogWithPlan, currentYearMonth } from "../lib/fireCalc";
import { formatYearMonth, formatYen } from "../lib/format";

interface Props {
  profile: FireProfile;
  roadmap: RoadmapResult;
  log: MonthlyLogEntry[];
  onChange: (log: MonthlyLogEntry[]) => void;
}

export function MonthlyLog({ profile, roadmap, log, onChange }: Props) {
  const [date, setDate] = useState(currentYearMonth());
  const [actualAssets, setActualAssets] = useState("");
  const [memo, setMemo] = useState("");

  const comparisons = compareLogWithPlan(profile, roadmap, log).slice().reverse();

  const addEntry = () => {
    const value = Number(actualAssets);
    if (!date || Number.isNaN(value) || actualAssets === "") return;

    const next = log.filter((entry) => entry.date !== date);
    next.push({ date, actualAssets: value, memo: memo || undefined });
    onChange(next);
    setActualAssets("");
    setMemo("");
  };

  const removeEntry = (targetDate: string) => {
    onChange(log.filter((entry) => entry.date !== targetDate));
  };

  return (
    <section className="card">
      <h2>毎月の資産記録</h2>
      <div className="log-form">
        <label className="form-field">
          <span className="form-label">対象月</span>
          <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">実際の資産額</span>
          <input
            type="number"
            placeholder="円"
            value={actualAssets}
            onChange={(e) => setActualAssets(e.target.value)}
          />
        </label>
        <label className="form-field form-field-memo">
          <span className="form-label">メモ(任意)</span>
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: ボーナス反映" />
        </label>
        <button type="button" className="btn-primary" onClick={addEntry}>
          記録する
        </button>
      </div>

      {comparisons.length === 0 ? (
        <p className="empty-hint">まだ記録がありません。毎月末に資産額を記録して振り返りましょう。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>年月</th>
                <th>実績</th>
                <th>計画</th>
                <th>差分</th>
                <th>進捗率</th>
                <th>メモ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.date}>
                  <td>{formatYearMonth(row.date)}</td>
                  <td>{formatYen(row.actualAssets)}</td>
                  <td>{formatYen(row.plannedAssets)}</td>
                  <td className={row.diff >= 0 ? "diff-positive" : "diff-negative"}>
                    {row.diff >= 0 ? "+" : ""}
                    {formatYen(row.diff)}
                  </td>
                  <td>{row.progressRate}%</td>
                  <td className="memo-cell">{row.memo ?? ""}</td>
                  <td>
                    <button type="button" className="btn-icon" onClick={() => removeEntry(row.date)} aria-label="削除">
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
