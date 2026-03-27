import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/auth/AuthGuard'
import Header from './components/layout/Header'
import Home from './pages/Home'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <div className="flex flex-col h-screen bg-slate-50">
          <Header />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard/:id" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </AuthGuard>
    </BrowserRouter>
  )
}
