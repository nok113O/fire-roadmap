import { monthsBetween } from "./dateUtils";

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // 本人・配偶者・子 など自由入力
  birthDate: string; // yyyy-mm
}

export type LifeEventCategory = "education" | "housing" | "car" | "other";

export const lifeEventCategoryLabels: Record<LifeEventCategory, string> = {
  education: "教育費",
  housing: "住宅",
  car: "車",
  other: "その他",
};

export interface LifeEvent {
  id: string;
  name: string;
  category: LifeEventCategory;
  kind: "one_time" | "recurring";
  amountManyen: number; // one_time: 総額(万円) / recurring: 年間額(万円/年)
  startDate: string; // yyyy-mm
  endDate?: string; // recurring のみ(この月を含めて終了)
  linkedMemberId?: string;
  memo?: string;
}

export interface LifeEventPreset {
  id: string;
  name: string;
  category: LifeEventCategory;
  kind: "one_time" | "recurring";
  amountManyen: number; // one_time: 総額(万円) / recurring: 年間額(万円/年)
  note?: string;
}

// 一般的なライフイベントの支出目安(万円)。あくまで目安のため各自編集して利用する想定。
// 出典: 文部科学省「令和5年度子供の学習費調査」、大学学費は各種銀行・進学情報サイトの公表資料、
// 結婚式費用はゼクシィ結婚トレンド調査、出産費用・新車価格は厚生労働省・日本自動車工業会の公表資料を参考にした概算値。
// 習い事費用はベネッセ・学研教室等の調査、趣味・娯楽費は総務省「家計調査」(2025年平均)を参考にした概算値。
export const defaultLifeEventPresets: LifeEventPreset[] = [
  { id: "preset_kinder_public", name: "幼稚園(公立)", category: "education", kind: "recurring", amountManyen: 18.5, note: "年額目安・3年間" },
  { id: "preset_kinder_private", name: "幼稚園(私立)", category: "education", kind: "recurring", amountManyen: 34.7, note: "年額目安・3年間" },
  { id: "preset_elementary_public", name: "小学校(公立)", category: "education", kind: "recurring", amountManyen: 33.6, note: "年額目安・6年間" },
  { id: "preset_elementary_private", name: "小学校(私立)", category: "education", kind: "recurring", amountManyen: 182.8, note: "年額目安・6年間" },
  { id: "preset_juniorhigh_public", name: "中学校(公立)", category: "education", kind: "recurring", amountManyen: 54.2, note: "年額目安・3年間" },
  { id: "preset_juniorhigh_private", name: "中学校(私立)", category: "education", kind: "recurring", amountManyen: 156, note: "年額目安・3年間" },
  { id: "preset_highschool_public", name: "高校(公立)", category: "education", kind: "recurring", amountManyen: 59.8, note: "年額目安・3年間" },
  { id: "preset_highschool_private", name: "高校(私立)", category: "education", kind: "recurring", amountManyen: 103, note: "年額目安・3年間" },
  { id: "preset_university_national", name: "大学(国公立)", category: "education", kind: "recurring", amountManyen: 62.5, note: "年額目安・4年間" },
  { id: "preset_university_private_arts", name: "大学(私立文系)", category: "education", kind: "recurring", amountManyen: 102.5, note: "年額目安・4年間" },
  { id: "preset_university_private_science", name: "大学(私立理系)", category: "education", kind: "recurring", amountManyen: 135.3, note: "年額目安・4年間" },
  { id: "preset_wedding", name: "結婚式(自己負担目安)", category: "other", kind: "one_time", amountManyen: 125, note: "総額目安343.9万円のうち自己負担分" },
  { id: "preset_childbirth", name: "出産費用(自己負担目安)", category: "other", kind: "one_time", amountManyen: 10, note: "出産育児一時金50万円差引後。差額ベッド代等で変動" },
  { id: "preset_car_standard", name: "車購入(普通車)", category: "car", kind: "one_time", amountManyen: 330, note: "新車平均価格目安" },
  { id: "preset_car_kei", name: "車購入(軽自動車)", category: "car", kind: "one_time", amountManyen: 200, note: "新車平均価格目安" },
  { id: "preset_housing_downpayment", name: "住宅購入(頭金目安)", category: "housing", kind: "one_time", amountManyen: 500, note: "物件価格・地域により大きく変動" },
  { id: "preset_lessons_preschool", name: "習い事(未就学児)", category: "education", kind: "recurring", amountManyen: 9.6, note: "年額目安・月1万円未満" },
  { id: "preset_lessons_elementary", name: "習い事(小学生)", category: "education", kind: "recurring", amountManyen: 18, note: "年額目安・月1.5万円程度(学年が上がるほど増加傾向)" },
  { id: "preset_lessons_juniorhigh", name: "習い事(中学生)", category: "education", kind: "recurring", amountManyen: 25.6, note: "年額目安・月21,371円の実測平均" },
  { id: "preset_hobby", name: "趣味・娯楽費", category: "other", kind: "recurring", amountManyen: 38.4, note: "年額目安・二人以上世帯の教養娯楽費(月3.2万円)。個人分のみなら減額して調整" },
];

export const educationStages = [
  { key: "kindergarten", label: "幼稚園", startAge: 3, years: 3 },
  { key: "elementary", label: "小学校", startAge: 6, years: 6 },
  { key: "juniorhigh", label: "中学校", startAge: 12, years: 3 },
  { key: "highschool", label: "高校", startAge: 15, years: 3 },
  { key: "university", label: "大学", startAge: 18, years: 4 },
] as const;

export type EducationStageKey = (typeof educationStages)[number]["key"];

// 入学は4月、卒業は3月という日本の学年暦に合わせて開始・終了月を計算する
// (4月以降生まれは満startAge歳になった翌年の4月入学、1〜3月生まれは同年4月入学という簡易ルール)
export function computeStageDates(birthDate: string, startAge: number, years: number): { startDate: string; endDate: string } {
  const [birthYearStr, birthMonthStr] = birthDate.split("-");
  const birthYear = Number(birthYearStr);
  const birthMonth = Number(birthMonthStr);
  const entryYear = birthYear + startAge + (birthMonth <= 3 ? 0 : 1);
  const startDate = `${entryYear}-04`;
  const endDate = `${entryYear + years}-03`;
  return { startDate, endDate };
}

// 続柄が「本人」の家族メンバーを返す(複数いる場合は最初の1件)
export function findSelfMember(members: FamilyMember[]): FamilyMember | undefined {
  return members.find((m) => m.relation.trim() === "本人");
}

// 生年月から基準月時点の年齢を計算する(小数第1位まで)
export function calculateAgeAt(birthDate: string, referenceDate: string): number {
  const months = monthsBetween(birthDate, referenceDate);
  return Math.round((months / 12) * 10) / 10;
}

function isEventActive(event: LifeEvent, date: string): boolean {
  if (date < event.startDate) return false;
  if (event.kind === "one_time") return date === event.startDate;
  if (event.endDate) return date <= event.endDate;
  return true;
}

// その月に発生するライフイベントによる資産への増減額(円、支出はマイナス)
export function monthlyLifeEventDeltaYen(events: LifeEvent[], date: string): number {
  const MANYEN = 10_000;
  let total = 0;
  for (const event of events) {
    if (!isEventActive(event, date)) continue;
    if (event.kind === "one_time") {
      total -= event.amountManyen * MANYEN;
    } else {
      total -= (event.amountManyen * MANYEN) / 12;
    }
  }
  return total;
}
