interface Props {
  value: string; // カンマなしの数値文字列("", "-", "1234.5" など入力途中の状態も許容)
  onChange: (raw: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function formatForDisplay(raw: string): string {
  if (raw === "" || raw === "-") return raw;
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  return n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

// 3桁ごとにカンマ区切り表示しつつ、入力値はカンマなしの数値文字列として親に渡す
export function CommaNumberInput({ value, onChange, disabled, placeholder }: Props) {
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      value={formatForDisplay(value)}
      onChange={(e) => {
        const stripped = e.target.value.replace(/,/g, "");
        if (!/^-?\d*\.?\d*$/.test(stripped)) return;
        onChange(stripped);
      }}
    />
  );
}
