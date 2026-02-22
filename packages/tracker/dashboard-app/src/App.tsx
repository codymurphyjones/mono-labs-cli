import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { NotationsProvider } from './hooks/useNotations'
import { Dashboard } from './pages/Dashboard'
import { NotationDetail } from './pages/NotationDetail'

export function App() {
  return (
    <BrowserRouter>
      <NotationsProvider>
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notation/:id" element={<NotationDetail />} />
          </Routes>
        </div>
      </NotationsProvider>
    </BrowserRouter>
  )
}
