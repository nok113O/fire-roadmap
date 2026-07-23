import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { FamilyPlan } from "./components/FamilyPlan";
import { MonthlyLog } from "./components/MonthlyLog";
import { ProfileForm } from "./components/ProfileForm";
import { RoadmapChart } from "./components/RoadmapChart";
import { SummaryCards } from "./components/SummaryCards";
import type { FamilyMember, LifeEvent, LifeEventPreset } from "./lib/familyPlan";
import type { AccountDef, FireProfile, MonthlyLogEntry } from "./lib/fireCalc";
import { calculateRoadmap } from "./lib/fireCalc";
import {
  loadAccounts,
  loadFamilyMembers,
  loadLifeEventPresets,
  loadLifeEvents,
  loadLog,
  loadProfile,
  saveAccounts,
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

  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveAccounts(accounts), [accounts]);
  useEffect(() => saveFamilyMembers(familyMembers), [familyMembers]);
  useEffect(() => saveLifeEvents(lifeEvents), [lifeEvents]);
  useEffect(() => saveLifeEventPresets(eventPresets), [eventPresets]);

  const roadmap = useMemo(() => calculateRoadmap(profile, lifeEvents), [profile, lifeEvents]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>FIREロードマップ</h1>
        <p className="app-subtitle">
          前提条件を入力して、FIRE達成までの資産推移を可視化し、毎月の実績を記録・振り返りましょう。
        </p>
      </header>

      <main className="app-main">
        <ProfileForm profile={profile} onChange={setProfile} />
        <FamilyPlan
          members={familyMembers}
          onMembersChange={setFamilyMembers}
          events={lifeEvents}
          onEventsChange={setLifeEvents}
          presets={eventPresets}
          onPresetsChange={setEventPresets}
        />
        <SummaryCards roadmap={roadmap} currentAge={profile.currentAge} />
        <RoadmapChart roadmap={roadmap} log={log} />
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
