import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
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
        <Route path="/season" element={<SeasonPage />} />
        <Route path="*" element={<Navigate to="/games" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
