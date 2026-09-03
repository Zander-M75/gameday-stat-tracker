import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AccountPage } from './pages/AccountPage'
import { DebugPage } from './pages/DebugPage'
import { GameDetailPage } from './pages/GameDetailPage'
import { GamesPage } from './pages/GamesPage'
import { RosterPage } from './pages/RosterPage'
import { SeasonPage } from './pages/SeasonPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/games" replace />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/season" element={<SeasonPage />} />
        {/* Not in NAV_ITEMS — reachable via Sidebar/AccountButton, see phase 7 notes in PROGRESS.md. */}
        <Route path="/account" element={<AccountPage />} />
        {/* Dev-only DB dump, not part of the coach-facing nav. */}
        {import.meta.env.DEV && <Route path="/debug" element={<DebugPage />} />}
        <Route path="*" element={<Navigate to="/games" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
