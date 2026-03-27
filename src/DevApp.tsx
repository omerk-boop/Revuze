import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DevLogin from './components/auth/DevLogin'
import DevHeader from './components/layout/DevHeader'
import Home from './pages/Home'
import DashboardPage from './pages/DashboardPage'
import { setAuthToken } from './services/api'
import { TokenContext } from './context/TokenContext'

const TOKEN_KEY = 'revuze_dev_token'

export default function DevApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (token) {
      setAuthToken(token)
      localStorage.setItem(TOKEN_KEY, token)
    }
  }, [token])

  if (!token) {
    return <DevLogin onToken={setToken} />
  }

  return (
    <TokenContext.Provider value={token}>
      <BrowserRouter>
        <div className="flex flex-col h-screen bg-slate-50">
          <DevHeader onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard/:id" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TokenContext.Provider>
  )
}
