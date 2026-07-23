import { useState } from "react";
import type { FamilyMember, LifeEvent, LifeEventCategory } from "../lib/familyPlan";
import { computeStageDates, educationStages, lifeEventCategoryLabels } from "../lib/familyPlan";
import { formatYearMonth } from "../lib/format";

interface Props {
  members: FamilyMember[];
  onMembersChange: (members: FamilyMember[]) => void;
  events: LifeEvent[];
  onEventsChange: (events: LifeEvent[]) => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function FamilyPlan({ members, onMembersChange, events, onEventsChange }: Props) {
  const [memberName, setMemberName] = useState("");
  const [memberRelation, setMemberRelation] = useState("");
  const [memberBirthDate, setMemberBirthDate] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState<LifeEventCategory>("education");
  const [eventKind, setEventKind] = useState<"one_time" | "recurring">("one_time");
  const [eventAmount, setEventAmount] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [linkedMemberId, setLinkedMemberId] = useState("");
  const [stageKey, setStageKey] = useState("");
  const [eventMemo, setEventMemo] = useState("");

  const addMember = () => {
    if (!memberName.trim() || !memberBirthDate) return;
    onMembersChange([
      ...members,
      { id: makeId("mem"), name: memberName.trim(), relation: memberRelation.trim(), birthDate: memberBirthDate },
    ]);
    setMemberName("");
    setMemberRelation("");
    setMemberBirthDate("");
  };

  const removeMember = (id: string) => onMembersChange(members.filter((m) => m.id !== id));

  const applyStagePreset = () => {
    const member = members.find((m) => m.id === linkedMemberId);
    const stage = educationStages.find((s) => s.key === stageKey);
    if (!member || !stage) return;
    const { startDate, endDate } = computeStageDates(member.birthDate, stage.startAge, stage.years);
    setEventStartDate(startDate);
    setEventEndDate(endDate);
    setEventKind("recurring");
    setEventCategory("education");
    if (!eventName) setEventName(`${member.name} ${stage.label}`);
  };

  const addEvent = () => {
    const amount = Number(eventAmount);
    if (!eventName.trim() || !eventStartDate || Number.isNaN(amount)) return;
    onEventsChange([
      ...events,
      {
        id: makeId("evt"),
        name: eventName.trim(),
        category: eventCategory,
        kind: eventKind,
        amountManyen: amount,
        startDate: eventStartDate,
        endDate: eventKind === "recurring" ? eventEndDate || undefined : undefined,
        linkedMemberId: linkedMemberId || undefined,
        memo: eventMemo || undefined,
      },
    ]);
    setEventName("");
    setEventAmount("");
    setEventStartDate("");
    setEventEndDate("");
    setEventMemo("");
  };

  const removeEvent = (id: string) => onEventsChange(events.filter((e) => e.id !== id));

  return (
    <section className="card">
      <h2>家族・ライフイベント</h2>

      <h3>家族メンバー</h3>
      <div className="log-form">
        <label className="form-field">
          <span className="form-label">名前</span>
          <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">続柄</span>
          <input
            type="text"
            placeholder="配偶者・子 など"
            value={memberRelation}
            onChange={(e) => setMemberRelation(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span className="form-label">生年月</span>
          <input type="month" value={memberBirthDate} onChange={(e) => setMemberBirthDate(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" onClick={addMember}>
          追加
        </button>
      </div>
      {members.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>続柄</th>
                <th>生年月</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.relation}</td>
                  <td>{formatYearMonth(m.birthDate)}</td>
                  <td>
                    <button type="button" className="btn-icon" onClick={() => removeMember(m.id)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>ライフイベント</h3>
      {members.length > 0 && (
        <div className="log-form">
          <label className="form-field">
            <span className="form-label">対象家族</span>
            <select value={linkedMemberId} onChange={(e) => setLinkedMemberId(e.target.value)}>
              <option value="">(選択なし)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">教育段階</span>
            <select value={stageKey} onChange={(e) => setStageKey(e.target.value)}>
              <option value="">(選択)</option>
              {educationStages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-icon"
            onClick={applyStagePreset}
            disabled={!linkedMemberId || !stageKey}
          >
            期間を自動入力
          </button>
        </div>
      )}
      <div className="log-form">
        <label className="form-field">
          <span className="form-label">名称</span>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="例: 長男 大学進学"
          />
        </label>
        <label className="form-field">
          <span className="form-label">カテゴリ</span>
          <select value={eventCategory} onChange={(e) => setEventCategory(e.target.value as LifeEventCategory)}>
            {Object.entries(lifeEventCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">種別</span>
          <select value={eventKind} onChange={(e) => setEventKind(e.target.value as "one_time" | "recurring")}>
            <option value="one_time">一時的な支出</option>
            <option value="recurring">継続的な支出</option>
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">金額</span>
          <input
            type="number"
            placeholder={eventKind === "recurring" ? "万円/年" : "万円(総額)"}
            value={eventAmount}
            onChange={(e) => setEventAmount(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span className="form-label">開始月</span>
          <input type="month" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} />
        </label>
        {eventKind === "recurring" && (
          <label className="form-field">
            <span className="form-label">終了月</span>
            <input type="month" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
          </label>
        )}
        <label className="form-field form-field-memo">
          <span className="form-label">メモ(任意)</span>
          <input type="text" value={eventMemo} onChange={(e) => setEventMemo(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" onClick={addEvent}>
          登録する
        </button>
      </div>

      {events.length === 0 ? (
        <p className="empty-hint">まだライフイベントが登録されていません。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>カテゴリ</th>
                <th>種別</th>
                <th>金額</th>
                <th>開始</th>
                <th>終了</th>
                <th>対象</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events
                .slice()
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.name}</td>
                    <td>{lifeEventCategoryLabels[ev.category]}</td>
                    <td>{ev.kind === "one_time" ? "一時金" : "継続"}</td>
                    <td>
                      {ev.amountManyen.toLocaleString("ja-JP")}万円
                      {ev.kind === "recurring" ? "/年" : ""}
                    </td>
                    <td>{formatYearMonth(ev.startDate)}</td>
                    <td>{ev.endDate ? formatYearMonth(ev.endDate) : "-"}</td>
                    <td>{members.find((m) => m.id === ev.linkedMemberId)?.name ?? ""}</td>
                    <td>
                      <button type="button" className="btn-icon" onClick={() => removeEvent(ev.id)}>
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
