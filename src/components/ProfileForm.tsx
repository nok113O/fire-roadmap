import type { FireProfile } from "../lib/fireCalc";

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
  { key: "currentAssets", label: "現在の資産額", suffix: "円" },
  { key: "monthlySavings", label: "毎月の貯蓄額", suffix: "円/月" },
  { key: "annualReturnRate", label: "想定年利回り", suffix: "%", step: 0.1 },
  { key: "annualExpensesAtFire", label: "FIRE後の年間支出", suffix: "円/年" },
  { key: "safeWithdrawalRate", label: "安全引出率(SWR)", suffix: "%", step: 0.1 },
];

export function ProfileForm({ profile, onChange }: Props) {
  const update = (key: keyof FireProfile, value: number) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <section className="card">
      <h2>前提条件</h2>
      <div className="form-grid">
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
    </section>
  );
}
