import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MonthlyLog } from "./components/MonthlyLog";
import { ProfileForm } from "./components/ProfileForm";
import { RoadmapChart } from "./components/RoadmapChart";
import { SummaryCards } from "./components/SummaryCards";
import type { AccountDef, FireProfile, MonthlyLogEntry } from "./lib/fireCalc";
import { calculateRoadmap } from "./lib/fireCalc";
import { loadAccounts, loadLog, loadProfile, saveAccounts, saveLog, saveProfile } from "./lib/storage";

function App() {
  const [profile, setProfile] = useState<FireProfile>(() => loadProfile());
  const [log, setLog] = useState<MonthlyLogEntry[]>(() => loadLog());
  const [accounts, setAccounts] = useState<AccountDef[]>(() => loadAccounts());

  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveAccounts(accounts), [accounts]);

  const roadmap = useMemo(() => calculateRoadmap(profile), [profile]);

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
