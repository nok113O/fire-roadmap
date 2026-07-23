import type { ChangeEvent } from "react";

// number入力の値をパースしつつ、先頭の余分な0(例: "032")をDOM上でも取り除く。
// 値が数値として変化しない場合(例: 3→32→032)、Reactは同じ値への更新とみなし
// DOMの再描画をスキップするため、入力途中の余分な0が画面に残ってしまうのを防ぐ。
export function parseNumberInput(e: ChangeEvent<HTMLInputElement>): number {
  const raw = e.target.value;
  const normalized = raw.replace(/^0+(?=\d)/, "");
  if (normalized !== raw) {
    e.target.value = normalized;
  }
  return Number(normalized === "" ? "0" : normalized);
}
