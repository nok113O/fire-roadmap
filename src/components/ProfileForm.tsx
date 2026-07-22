import type { FireProfile } from "../lib/fireCalc";
import { currentAssetsTotalYen } from "../lib/fireCalc";
import { formatYenCompact } from "../lib/format";

interface Props {
  profile: FireProfile;
  onChange: (profile: FireProfile) => void;
}

interface FieldDef {
  key: keyof FireProfile;
  label: string;
  suffix: string;
  step?: number;
}

const fields: FieldDef[] = [
  { key: "currentAge", label: "現在の年齢", suffix: "歳" },
  { key: "monthlySavings", label: "毎月の貯蓄額", suffix: "円/月" },
  { key: "annualReturnRate", label: "想定年利回り", suffix: "%", step: 0.1 },
  { key: "annualExpensesAtFire", label: "FIRE後の年間支出", suffix: "円/年" },
  { key: "safeWithdrawalRate", label: "安全引出率(SWR)", suffix: "%", step: 0.1 },
];

export function ProfileForm({ profile, onChange }: Props) {
  const update = (key: keyof FireProfile, value: number) => {
    onChange({ ...profile, [key]: value });
  };

  const total = currentAssetsTotalYen(profile);

  return (
    <section className="card">
      <h2>前提条件</h2>
      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">現在の資産(日本)</span>
          <div className="form-input-wrap">
            <input
              type="number"
              value={profile.currentAssetsJpyManyen}
              onChange={(e) => update("currentAssetsJpyManyen", Number(e.target.value))}
            />
            <span className="form-suffix">万円</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">現在の資産(中国)</span>
          <div className="form-input-wrap">
            <input
              type="number"
              value={profile.currentAssetsCny}
              onChange={(e) => update("currentAssetsCny", Number(e.target.value))}
            />
            <span className="form-suffix">元(CNY)</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">現在の為替レート</span>
          <div className="form-input-wrap">
            <input
              type="number"
              step={0.01}
              value={profile.cnyExchangeRate}
              onChange={(e) => update("cnyExchangeRate", Number(e.target.value))}
            />
            <span className="form-suffix">円/CNY</span>
          </div>
        </label>
        {fields.map((field) => (
          <label key={field.key} className="form-field">
            <span className="form-label">{field.label}</span>
            <div className="form-input-wrap">
              <input
                type="number"
                step={field.step ?? 1}
                value={profile[field.key] as number}
                onChange={(e) => update(field.key, Number(e.target.value))}
              />
              <span className="form-suffix">{field.suffix}</span>
            </div>
          </label>
        ))}
        <label className="form-field">
          <span className="form-label">計画の起点月</span>
          <div className="form-input-wrap">
            <input
              type="month"
              value={profile.startDate}
              onChange={(e) => onChange({ ...profile, startDate: e.target.value })}
            />
          </div>
        </label>
      </div>
      <p className="form-total-hint">現在の資産合計(円換算): {formatYenCompact(total)}</p>
    </section>
  );
}
