interface Props {
  value: string; // カンマなしの数値文字列("", "-", "1234.5" など入力途中の状態も許容)
  onChange: (raw: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 整数部分だけにカンマを入れ、小数点以下は入力途中の状態(末尾の"."や"0"など)をそのまま保持する。
// Number()経由で丸めてしまうと「57.」まで入力した瞬間に小数点が消え、カーソル位置がずれて
// 続けて入力した数字が末尾に付いてしまう(例: 57.5 のつもりが 575 になる)不具合が起きるため。
function formatForDisplay(raw: string): string {
  if (raw === "" || raw === "-") return raw;
  const negative = raw.startsWith("-");
  const body = negative ? raw.slice(1) : raw;
  const dotIndex = body.indexOf(".");
  const integerPart = dotIndex === -1 ? body : body.slice(0, dotIndex);
  const decimalPart = dotIndex === -1 ? null : body.slice(dotIndex + 1);
  const integerNum = integerPart === "" ? 0 : Number(integerPart);
  if (Number.isNaN(integerNum)) return raw;
  const sign = negative ? "-" : "";
  const formattedInteger = integerNum.toLocaleString("ja-JP");
  return decimalPart === null ? `${sign}${formattedInteger}` : `${sign}${formattedInteger}.${decimalPart}`;
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
