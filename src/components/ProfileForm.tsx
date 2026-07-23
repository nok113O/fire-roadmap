import type { FamilyMember } from "../lib/familyPlan";
import { calculateAgeAt } from "../lib/familyPlan";
import type { FireProfile, LatestLogSnapshot } from "../lib/fireCalc";
import { currentAssetsTotalYen } from "../lib/fireCalc";
import { formatYearMonth } from "../lib/format";
import { parseNumberInput } from "../lib/numberInput";
import { CommaNumberInput } from "./CommaNumberInput";

interface Props {
  profile: FireProfile;
  onChange: (profile: FireProfile) => void;
  latestSnapshot: LatestLogSnapshot | null;
  selfMember: FamilyMember | undefined;
}

interface FieldDef {
  key: keyof FireProfile;
  label: string;
  suffix: string;
  step?: number;
  commaFormat?: boolean;
}

const baseFields: FieldDef[] = [
  { key: "monthlySavings", label: "毎月の貯蓄額", suffix: "円/月", commaFormat: true },
  { key: "annualReturnRate", label: "想定年利回り", suffix: "%", step: 0.1 },
];

const semiFireFields: FieldDef[] = [
  { key: "semiFireAnnualExpenses", label: "セミFIRE後の年間支出", suffix: "円/年", commaFormat: true },
  { key: "semiFirePartTimeIncome", label: "セミFIRE後の就労収入", suffix: "円/年", commaFormat: true },
  { key: "semiFireSafeWithdrawalRate", label: "安全引出率(SWR)", suffix: "%", step: 0.1 },
];

const fullFireFields: FieldDef[] = [
  { key: "fullFireAnnualExpenses", label: "完全FIRE後の年間支出", suffix: "円/年", commaFormat: true },
  { key: "fullFireSafeWithdrawalRate", label: "安全引出率(SWR)", suffix: "%", step: 0.1 },
];

export function ProfileForm({ profile, onChange, latestSnapshot, selfMember }: Props) {
  const update = (key: keyof FireProfile, value: number) => {
    onChange({ ...profile, [key]: value });
  };

  const effectiveTotal = latestSnapshot
    ? latestSnapshot.jpyManyen * 10_000 + latestSnapshot.cny * latestSnapshot.exchangeRate
    : currentAssetsTotalYen(profile);

  const computedAge = selfMember ? calculateAgeAt(selfMember.birthDate, profile.startDate) : null;

  const renderField = (field: FieldDef) => (
    <label key={field.key} className="form-field">
      <span className="form-label">{field.label}</span>
      <div className="form-input-wrap">
        {field.commaFormat ? (
          <CommaNumberInput
            value={String(profile[field.key] as number)}
            onChange={(raw) => update(field.key, raw === "" || raw === "-" ? 0 : Number(raw))}
          />
        ) : (
          <input
            type="number"
            step={field.step ?? 1}
            value={profile[field.key] as number}
            onChange={(e) => update(field.key, parseNumberInput(e))}
          />
        )}
        <span className="form-suffix">{field.suffix}</span>
      </div>
    </label>
  );

  return (
    <section className="card">
      <h2>前提条件</h2>

      {latestSnapshot ? (
        <p className="form-total-hint">
          {formatYearMonth(latestSnapshot.date)}の実績記録を「現在の資産」として計画に使用中です。下記の入力欄は実績記録が無い場合のみ使われます。
        </p>
      ) : (
        <p className="form-total-hint">まだ実績記録がないため、下記の入力値を「現在の資産」として計画に使用します。</p>
      )}

      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">現在の資産(日本+中国合算){latestSnapshot ? "(実績記録)" : ""}</span>
          <div className="form-input-wrap">
            <CommaNumberInput
              disabled={!!latestSnapshot}
              value={String(Math.round(effectiveTotal))}
              onChange={(raw) => {
                const yen = raw === "" || raw === "-" ? 0 : Number(raw);
                onChange({ ...profile, currentAssetsJpyManyen: yen / 10_000, currentAssetsCny: 0 });
              }}
            />
            <span className="form-suffix">円</span>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">現在の年齢{computedAge != null ? "(本人の生年月から自動計算)" : ""}</span>
          <div className="form-input-wrap">
            <input
              type="number"
              disabled={computedAge != null}
              value={computedAge ?? profile.currentAge}
              onChange={(e) => update("currentAge", parseNumberInput(e))}
            />
            <span className="form-suffix">歳</span>
          </div>
        </label>
        {baseFields.map(renderField)}
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

      <h3>セミFIRE目標</h3>
      <div className="form-grid">{semiFireFields.map(renderField)}</div>

      <h3>完全FIRE目標</h3>
      <div className="form-grid">{fullFireFields.map(renderField)}</div>
    </section>
  );
}
