import { useState } from "react";
import type { FamilyMember, LifeEvent, LifeEventCategory, LifeEventPreset } from "../lib/familyPlan";
import { computeStageDates, educationStages, lifeEventCategoryLabels } from "../lib/familyPlan";
import { formatYearMonth } from "../lib/format";
import { CommaNumberInput } from "./CommaNumberInput";

interface Props {
  members: FamilyMember[];
  onMembersChange: (members: FamilyMember[]) => void;
  events: LifeEvent[];
  onEventsChange: (events: LifeEvent[]) => void;
  presets: LifeEventPreset[];
  onPresetsChange: (presets: LifeEventPreset[]) => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function FamilyPlan({ members, onMembersChange, events, onEventsChange, presets, onPresetsChange }: Props) {
  const [memberName, setMemberName] = useState("");
  const [memberRelation, setMemberRelation] = useState("");
  const [memberBirthDate, setMemberBirthDate] = useState("");

  const [presetId, setPresetId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState<LifeEventCategory>("education");
  const [eventKind, setEventKind] = useState<"one_time" | "recurring">("one_time");
  const [eventAmount, setEventAmount] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [linkedMemberId, setLinkedMemberId] = useState("");
  const [stageKey, setStageKey] = useState("");
  const [eventMemo, setEventMemo] = useState("");

  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState<LifeEventCategory>("other");
  const [newPresetKind, setNewPresetKind] = useState<"one_time" | "recurring">("one_time");
  const [newPresetAmount, setNewPresetAmount] = useState("");
  const [newPresetNote, setNewPresetNote] = useState("");

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

  const applyEventPreset = (id: string) => {
    setPresetId(id);
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setEventName(preset.name);
    setEventCategory(preset.category);
    setEventKind(preset.kind);
    setEventAmount(String(preset.amountManyen));
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
    setPresetId("");
    setEventName("");
    setEventAmount("");
    setEventStartDate("");
    setEventEndDate("");
    setEventMemo("");
  };

  const removeEvent = (id: string) => onEventsChange(events.filter((e) => e.id !== id));

  const addPreset = () => {
    const name = newPresetName.trim();
    const amount = Number(newPresetAmount);
    if (!name || Number.isNaN(amount)) return;
    onPresetsChange([
      ...presets,
      {
        id: makeId("preset"),
        name,
        category: newPresetCategory,
        kind: newPresetKind,
        amountManyen: amount,
        note: newPresetNote.trim() || undefined,
      },
    ]);
    setNewPresetName("");
    setNewPresetAmount("");
    setNewPresetNote("");
  };

  const updatePreset = (id: string, patch: Partial<LifeEventPreset>) => {
    onPresetsChange(presets.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePreset = (id: string) => onPresetsChange(presets.filter((p) => p.id !== id));

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

      <details className="bulk-import">
        <summary>支出目安マスタを管理</summary>
        <p className="bulk-import-hint">
          一般的なライフイベントの支出目安(万円)です。ご自身の実態に合わせて金額を編集したり、追加・削除できます。
        </p>
        <div className="account-list">
          {presets.map((preset) => (
            <div key={preset.id} className="preset-row">
              <input
                type="text"
                value={preset.name}
                onChange={(e) => updatePreset(preset.id, { name: e.target.value })}
              />
              <select
                value={preset.category}
                onChange={(e) => updatePreset(preset.id, { category: e.target.value as LifeEventCategory })}
              >
                {Object.entries(lifeEventCategoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={preset.kind}
                onChange={(e) => updatePreset(preset.id, { kind: e.target.value as "one_time" | "recurring" })}
              >
                <option value="one_time">一時金</option>
                <option value="recurring">継続(年額)</option>
              </select>
              <CommaNumberInput
                value={String(preset.amountManyen)}
                onChange={(raw) =>
                  updatePreset(preset.id, { amountManyen: raw === "" || raw === "-" ? 0 : Number(raw) })
                }
              />
              <span className="preset-note">{preset.note}</span>
              <button type="button" className="btn-icon" onClick={() => removePreset(preset.id)}>
                削除
              </button>
            </div>
          ))}
          <div className="preset-row">
            <input
              type="text"
              placeholder="新しい項目名"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
            <select value={newPresetCategory} onChange={(e) => setNewPresetCategory(e.target.value as LifeEventCategory)}>
              {Object.entries(lifeEventCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select value={newPresetKind} onChange={(e) => setNewPresetKind(e.target.value as "one_time" | "recurring")}>
              <option value="one_time">一時金</option>
              <option value="recurring">継続(年額)</option>
            </select>
            <CommaNumberInput placeholder="万円" value={newPresetAmount} onChange={setNewPresetAmount} />
            <input
              type="text"
              placeholder="メモ(任意)"
              value={newPresetNote}
              onChange={(e) => setNewPresetNote(e.target.value)}
            />
            <button type="button" className="btn-icon" onClick={addPreset}>
              追加
            </button>
          </div>
        </div>
      </details>

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
          <span className="form-label">支出目安から選択</span>
          <select value={presetId} onChange={(e) => applyEventPreset(e.target.value)}>
            <option value="">(選択して自動入力)</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}({preset.amountManyen.toLocaleString("ja-JP")}万円{preset.kind === "recurring" ? "/年" : ""})
              </option>
            ))}
          </select>
        </label>
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
          <CommaNumberInput
            placeholder={eventKind === "recurring" ? "万円/年" : "万円(総額)"}
            value={eventAmount}
            onChange={setEventAmount}
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
