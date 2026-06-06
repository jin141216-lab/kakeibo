import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Add from './pages/Add'
import Analytics from './pages/Analytics'
import Transactions from './pages/Transactions'
import Import from './pages/Import'
import './App.css'

function Nav() {
  const location = useLocation()
  const links = [
    { to: '/', label: 'ホーム', icon: '🏠' },
    { to: '/analytics', label: '分析', icon: '📊' },
    { to: '/transactions', label: '明細', icon: '📋' },
    { to: '/import', label: '取込', icon: '📥' },
  ]
  return (
    <nav className="nav">
      {links.map(l => (
        <Link key={l.to} to={l.to} className={`nav-item ${location.pathname === l.to ? 'active' : ''}`}>
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<Add />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/import" element={<Import />} />
        </Routes>
        <Nav />
      </div>
    </BrowserRouter>
  )
}
