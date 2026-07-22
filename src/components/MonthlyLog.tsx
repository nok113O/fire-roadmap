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

function upsertEntries(log: MonthlyLogEntry[], entries: MonthlyLogEntry[]): MonthlyLogEntry[] {
  const byDate = new Map(log.map((entry) => [entry.date, entry]));
  for (const entry of entries) {
    byDate.set(entry.date, entry);
  }
  return Array.from(byDate.values());
}

// 1行 = "年月,日本資産(万円),中国資産(元),為替レート[,メモ]" (タブ/カンマ/スペース区切り)
function parseBulkImportText(text: string): { entries: MonthlyLogEntry[]; errorLines: number[] } {
  const entries: MonthlyLogEntry[] = [];
  const errorLines: number[] = [];

  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line, index) => {
      const cols = line.split(/[,\t]+/).map((c) => c.trim());
      const [date, jpy, cny, rate, ...memoParts] = cols;
      const assetsJpyManyen = Number(jpy);
      const assetsCny = Number(cny);
      const exchangeRate = Number(rate);

      if (!/^\d{4}-\d{2}$/.test(date ?? "") || [assetsJpyManyen, assetsCny, exchangeRate].some(Number.isNaN)) {
        errorLines.push(index + 1);
        return;
      }

      entries.push({
        date,
        assetsJpyManyen,
        assetsCny,
        exchangeRate,
        memo: memoParts.join(" ") || undefined,
      });
    });

  return { entries, errorLines };
}

export function MonthlyLog({ profile, roadmap, log, onChange }: Props) {
  const [date, setDate] = useState(currentYearMonth());
  const [assetsJpyManyen, setAssetsJpyManyen] = useState("");
  const [assetsCny, setAssetsCny] = useState("");
  const [exchangeRate, setExchangeRate] = useState(String(profile.cnyExchangeRate));
  const [memo, setMemo] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const comparisons = compareLogWithPlan(profile, roadmap, log).slice().reverse();

  const addEntry = () => {
    const jpy = Number(assetsJpyManyen);
    const cny = Number(assetsCny);
    const rate = Number(exchangeRate);
    if (!date || [jpy, cny, rate].some((v) => Number.isNaN(v))) return;

    onChange(
      upsertEntries(log, [{ date, assetsJpyManyen: jpy, assetsCny: cny, exchangeRate: rate, memo: memo || undefined }]),
    );
    setAssetsJpyManyen("");
    setAssetsCny("");
    setMemo("");
  };

  const removeEntry = (targetDate: string) => {
    onChange(log.filter((entry) => entry.date !== targetDate));
  };

  const runBulkImport = () => {
    const { entries, errorLines } = parseBulkImportText(bulkText);
    if (entries.length > 0) {
      onChange(upsertEntries(log, entries));
    }
    setBulkResult(
      errorLines.length > 0
        ? `${entries.length}件取り込みました(${errorLines.join(", ")}行目は形式エラーのためスキップ)`
        : `${entries.length}件取り込みました`,
    );
    if (errorLines.length === 0) setBulkText("");
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
          <span className="form-label">日本資産</span>
          <input
            type="number"
            placeholder="万円"
            value={assetsJpyManyen}
            onChange={(e) => setAssetsJpyManyen(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span className="form-label">中国資産</span>
          <input type="number" placeholder="元(CNY)" value={assetsCny} onChange={(e) => setAssetsCny(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">為替レート</span>
          <input
            type="number"
            step={0.01}
            placeholder="円/CNY"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
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

      <details className="bulk-import">
        <summary>過去実績をまとめて取り込む</summary>
        <p className="bulk-import-hint">
          1行につき1か月分を「年月,日本資産(万円),中国資産(元),為替レート」の形式(カンマまたはタブ区切り)で貼り付けてください。
          <br />
          例: 2023-01,1371,50802,14.2
        </p>
        <textarea
          className="bulk-import-textarea"
          rows={6}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"2023-01,1371,50802,14.2\n2023-02,1390,58596,14.3"}
        />
        <div className="bulk-import-actions">
          <button type="button" className="btn-primary" onClick={runBulkImport} disabled={bulkText.trim() === ""}>
            一括取り込み
          </button>
          {bulkResult && <span className="bulk-import-result">{bulkResult}</span>}
        </div>
      </details>

      {comparisons.length === 0 ? (
        <p className="empty-hint">まだ記録がありません。毎月末に資産額を記録して振り返りましょう。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>年月</th>
                <th>日本(万円)</th>
                <th>中国(CNY)</th>
                <th>レート</th>
                <th>実績合計</th>
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
                  <td>{row.assetsJpyManyen.toLocaleString("ja-JP")}</td>
                  <td>{row.assetsCny.toLocaleString("ja-JP")}</td>
                  <td>{row.exchangeRate}</td>
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
