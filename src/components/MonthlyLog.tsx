import { useState } from "react";
import type { AccountDef, FireProfile, MonthlyLogEntry, RoadmapResult } from "../lib/fireCalc";
import { compareLogWithPlan, currentYearMonth } from "../lib/fireCalc";
import { formatYearMonth, formatYen } from "../lib/format";
import { CommaNumberInput } from "./CommaNumberInput";

interface Props {
  profile: FireProfile;
  roadmap: RoadmapResult;
  log: MonthlyLogEntry[];
  onChange: (log: MonthlyLogEntry[]) => void;
  accounts: AccountDef[];
  onAccountsChange: (accounts: AccountDef[]) => void;
}

const BULK_IMPORT_ACCOUNT_ID = "_bulk";

function upsertEntries(log: MonthlyLogEntry[], entries: MonthlyLogEntry[]): MonthlyLogEntry[] {
  const byDate = new Map(log.map((entry) => [entry.date, entry]));
  for (const entry of entries) {
    byDate.set(entry.date, entry);
  }
  return Array.from(byDate.values());
}

function makeAccountId(): string {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// 1行 = "年月,日本資産合計(万円),中国資産(元),為替レート[,メモ]" (タブ/カンマ/スペース区切り)
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
      const jpyManyen = Number(jpy);
      const cnyAssets = Number(cny);
      const exchangeRate = Number(rate);

      if (!/^\d{4}-\d{2}$/.test(date ?? "") || [jpyManyen, cnyAssets, exchangeRate].some(Number.isNaN)) {
        errorLines.push(index + 1);
        return;
      }

      entries.push({
        date,
        jpyAccountBalances: { [BULK_IMPORT_ACCOUNT_ID]: jpyManyen },
        jpyIncome: 0,
        jpyExpense: 0,
        cnyAssets,
        cnyIncome: 0,
        cnyExpense: 0,
        exchangeRate,
        memo: memoParts.join(" ") || undefined,
      });
    });

  return { entries, errorLines };
}

export function MonthlyLog({ profile, roadmap, log, onChange, accounts, onAccountsChange }: Props) {
  const [date, setDate] = useState(currentYearMonth());
  const [accountInputs, setAccountInputs] = useState<Record<string, string>>({});
  const [jpyIncome, setJpyIncome] = useState("");
  const [jpyExpense, setJpyExpense] = useState("");
  const [cnyAssets, setCnyAssets] = useState("");
  const [cnyIncome, setCnyIncome] = useState("");
  const [cnyExpense, setCnyExpense] = useState("");
  const [exchangeRate, setExchangeRate] = useState(String(profile.cnyExchangeRate));
  const [memo, setMemo] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const excludedAccountIds = new Set(accounts.filter((a) => a.excludeFromTotal).map((a) => a.id));
  const comparisons = compareLogWithPlan(profile, roadmap, log, excludedAccountIds).slice().reverse();

  const addAccount = () => {
    const name = newAccountName.trim();
    if (!name) return;
    onAccountsChange([...accounts, { id: makeAccountId(), name }]);
    setNewAccountName("");
  };

  const renameAccount = (id: string, name: string) => {
    onAccountsChange(accounts.map((a) => (a.id === id ? { ...a, name } : a)));
  };

  const toggleAccountExclude = (id: string, excludeFromTotal: boolean) => {
    onAccountsChange(accounts.map((a) => (a.id === id ? { ...a, excludeFromTotal } : a)));
  };

  const removeAccount = (id: string) => {
    onAccountsChange(accounts.filter((a) => a.id !== id));
  };

  const addEntry = () => {
    const jpyAccountBalances: Record<string, number> = {};
    for (const account of accounts) {
      jpyAccountBalances[account.id] = Number(accountInputs[account.id] ?? 0) || 0;
    }
    const cny = Number(cnyAssets) || 0;
    const rate = Number(exchangeRate);
    const income = Number(jpyIncome) || 0;
    const expense = Number(jpyExpense) || 0;
    const cnyIn = Number(cnyIncome) || 0;
    const cnyOut = Number(cnyExpense) || 0;
    const hasAnyValue =
      Object.values(jpyAccountBalances).some((v) => v !== 0) ||
      cny !== 0 ||
      income !== 0 ||
      expense !== 0 ||
      cnyIn !== 0 ||
      cnyOut !== 0;
    if (!date || Number.isNaN(rate) || !hasAnyValue) return;

    onChange(
      upsertEntries(log, [
        {
          date,
          jpyAccountBalances,
          jpyIncome: income,
          jpyExpense: expense,
          cnyAssets: cny,
          cnyIncome: cnyIn,
          cnyExpense: cnyOut,
          exchangeRate: rate,
          memo: memo || undefined,
        },
      ]),
    );
    setAccountInputs({});
    setJpyIncome("");
    setJpyExpense("");
    setCnyAssets("");
    setCnyIncome("");
    setCnyExpense("");
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

      <details className="bulk-import">
        <summary>口座を管理</summary>
        <div className="account-list">
          {accounts.map((account) => (
            <div key={account.id} className="account-row">
              <input
                type="text"
                value={account.name}
                onChange={(e) => renameAccount(account.id, e.target.value)}
              />
              <label className="account-exclude-toggle">
                <input
                  type="checkbox"
                  checked={!!account.excludeFromTotal}
                  onChange={(e) => toggleAccountExclude(account.id, e.target.checked)}
                />
                FIRE計算から除外
              </label>
              <button type="button" className="btn-icon" onClick={() => removeAccount(account.id)}>
                削除
              </button>
            </div>
          ))}
          <div className="account-row">
            <input
              type="text"
              placeholder="新しい口座名"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />
            <button type="button" className="btn-icon" onClick={addAccount}>
              追加
            </button>
          </div>
        </div>
      </details>

      <div className="log-form">
        <label className="form-field">
          <span className="form-label">対象月</span>
          <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">日本 収入</span>
          <CommaNumberInput placeholder="万円" value={jpyIncome} onChange={setJpyIncome} />
        </label>
        <label className="form-field">
          <span className="form-label">日本 支出</span>
          <CommaNumberInput placeholder="万円" value={jpyExpense} onChange={setJpyExpense} />
        </label>
        <label className="form-field">
          <span className="form-label">中国 資産</span>
          <CommaNumberInput placeholder="元(CNY)" value={cnyAssets} onChange={setCnyAssets} />
        </label>
        <label className="form-field">
          <span className="form-label">中国 収入</span>
          <CommaNumberInput placeholder="元(CNY)" value={cnyIncome} onChange={setCnyIncome} />
        </label>
        <label className="form-field">
          <span className="form-label">中国 支出</span>
          <CommaNumberInput placeholder="元(CNY)" value={cnyExpense} onChange={setCnyExpense} />
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
      </div>

      <div className="log-form">
        {accounts.map((account) => (
          <label key={account.id} className="form-field">
            <span className="form-label">
              {account.name}
              {account.excludeFromTotal ? "(FIRE計算対象外)" : ""}
            </span>
            <CommaNumberInput
              placeholder="万円"
              value={accountInputs[account.id] ?? ""}
              onChange={(raw) => setAccountInputs({ ...accountInputs, [account.id]: raw })}
            />
          </label>
        ))}
      </div>

      <div className="log-form">
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
          1行につき1か月分を「年月,日本資産合計(万円),中国資産(元),為替レート」の形式(カンマまたはタブ区切り)で貼り付けてください。口座別の内訳は付きません(合計のみ)。
          <br />
          例: 2023-01,1371,50802,22.0
        </p>
        <textarea
          className="bulk-import-textarea"
          rows={6}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"2023-01,1371,50802,22.0\n2023-02,1390,58596,22.0"}
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
                <th>日本合計(万円)</th>
                <th>中国(CNY)</th>
                <th>レート</th>
                <th>実績合計</th>
                <th>計画</th>
                <th>差分</th>
                <th>進捗率(完全FIRE)</th>
                <th>メモ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.date}>
                  <td>{formatYearMonth(row.date)}</td>
                  <td>{row.jpyAssetsManyen.toLocaleString("ja-JP")}</td>
                  <td>{row.cnyAssets.toLocaleString("ja-JP")}</td>
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
