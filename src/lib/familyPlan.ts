import { addMonths } from "./dateUtils";

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

export const educationStages = [
  { key: "elementary", label: "小学校", startAge: 6, years: 6 },
  { key: "juniorhigh", label: "中学校", startAge: 12, years: 3 },
  { key: "highschool", label: "高校", startAge: 15, years: 3 },
  { key: "university", label: "大学", startAge: 18, years: 4 },
] as const;

export type EducationStageKey = (typeof educationStages)[number]["key"];

export function computeStageDates(birthDate: string, startAge: number, years: number): { startDate: string; endDate: string } {
  const startDate = addMonths(birthDate, startAge * 12);
  const endDate = addMonths(startDate, years * 12 - 1);
  return { startDate, endDate };
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
