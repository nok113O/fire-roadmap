import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { DividendSimulator } from "./components/DividendSimulator";
import { FamilyPlan } from "./components/FamilyPlan";
import { MonthlyLog } from "./components/MonthlyLog";
import { ProfileForm } from "./components/ProfileForm";
import { RoadmapChart } from "./components/RoadmapChart";
import { SummaryCards } from "./components/SummaryCards";
import type { DividendPlan } from "./lib/dividendCalc";
import { calculateAgeAt, findSelfMember } from "./lib/familyPlan";
import type { FamilyMember, LifeEvent, LifeEventPreset } from "./lib/familyPlan";
import type { AccountDef, FireProfile, MonthlyLogEntry } from "./lib/fireCalc";
import { calculateRoadmap, latestLogSnapshot } from "./lib/fireCalc";
import {
  loadAccounts,
  loadDividendPlan,
  loadFamilyMembers,
  loadLifeEventPresets,
  loadLifeEvents,
  loadLog,
  loadProfile,
  saveAccounts,
  saveDividendPlan,
  saveFamilyMembers,
  saveLifeEventPresets,
  saveLifeEvents,
  saveLog,
  saveProfile,
} from "./lib/storage";

function App() {
  const [profile, setProfile] = useState<FireProfile>(() => loadProfile());
  const [log, setLog] = useState<MonthlyLogEntry[]>(() => loadLog());
  const [accounts, setAccounts] = useState<AccountDef[]>(() => loadAccounts());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => loadFamilyMembers());
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>(() => loadLifeEvents());
  const [eventPresets, setEventPresets] = useState<LifeEventPreset[]>(() => loadLifeEventPresets());
  const [dividendPlan, setDividendPlan] = useState<DividendPlan>(() => loadDividendPlan());

  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveAccounts(accounts), [accounts]);
  useEffect(() => saveFamilyMembers(familyMembers), [familyMembers]);
  useEffect(() => saveLifeEvents(lifeEvents), [lifeEvents]);
  useEffect(() => saveLifeEventPresets(eventPresets), [eventPresets]);
  useEffect(() => saveDividendPlan(dividendPlan), [dividendPlan]);

  const excludedAccountIds = useMemo(
    () => new Set(accounts.filter((a) => a.excludeFromTotal).map((a) => a.id)),
    [accounts],
  );

  const snapshot = useMemo(() => latestLogSnapshot(log, excludedAccountIds), [log, excludedAccountIds]);

  const selfMember = useMemo(() => findSelfMember(familyMembers), [familyMembers]);

  // 前月分の実績記録があればそれを「現在の資産」として計画の起点に使う(無ければ最新の記録、記録が無ければ前提条件の手入力値)
  // 続柄「本人」の家族メンバーが登録されていれば、その生年月から年齢を自動計算する
  const effectiveProfile: FireProfile = useMemo(() => {
    let result = profile;
    if (snapshot) {
      result = {
        ...result,
        currentAssetsJpyManyen: snapshot.jpyManyen,
        currentAssetsCny: snapshot.cny,
        cnyExchangeRate: snapshot.exchangeRate,
      };
    }
    if (selfMember) {
      result = { ...result, currentAge: calculateAgeAt(selfMember.birthDate, profile.startDate) };
    }
    return result;
  }, [profile, snapshot, selfMember]);

  const roadmap = useMemo(
    () => calculateRoadmap(effectiveProfile, lifeEvents, dividendPlan),
    [effectiveProfile, lifeEvents, dividendPlan],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>FIREロードマップ</h1>
        <p className="app-subtitle">
          前提条件を入力して、FIRE達成までの資産推移を可視化し、毎月の実績を記録・振り返りましょう。
        </p>
      </header>

      <main className="app-main">
        <ProfileForm
          profile={profile}
          onChange={setProfile}
          latestSnapshot={snapshot}
          selfMember={selfMember}
          lifeEvents={lifeEvents}
        />
        <FamilyPlan
          members={familyMembers}
          onMembersChange={setFamilyMembers}
          events={lifeEvents}
          onEventsChange={setLifeEvents}
          presets={eventPresets}
          onPresetsChange={setEventPresets}
        />
        <SummaryCards roadmap={roadmap} profile={effectiveProfile} />
        <DividendSimulator plan={dividendPlan} onChange={setDividendPlan} />
        <RoadmapChart roadmap={roadmap} log={log} excludedAccountIds={excludedAccountIds} />
        <MonthlyLog
          profile={profile}
          roadmap={roadmap}
          log={log}
          onChange={setLog}
          accounts={accounts}
          onAccountsChange={setAccounts}
        />
      </main>
    </div>
  );
}

export default App;
