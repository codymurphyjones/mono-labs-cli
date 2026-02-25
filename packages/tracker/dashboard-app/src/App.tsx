import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { NotationsProvider } from './hooks/useNotations'
import { Dashboard } from './pages/Dashboard'
import { NotationDetail } from './pages/NotationDetail'
import { ManageNotations } from './pages/ManageNotations'

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <NotationsProvider>
          <div className="min-h-screen font-sans">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/manage" element={<ManageNotations />} />
              <Route path="/notation/:id" element={<NotationDetail />} />
            </Routes>
          </div>
        </NotationsProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
