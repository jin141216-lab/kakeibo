import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Add from './pages/Add'
import Analytics from './pages/Analytics'
import Transactions from './pages/Transactions'
import Import from './pages/Import'
import Categorize from './pages/Categorize'
import './App.css'

function Nav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <span>🏠</span>
        <span>ホーム</span>
      </Link>
      <Link to="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
        <span>📊</span>
        <span>分析</span>
      </Link>
      <button className="nav-fab" onClick={() => navigate('/add')}>
        <span>＋</span>
      </button>
      <Link to="/categorize" className={`nav-item ${isActive('/categorize') ? 'active' : ''}`}>
        <span>🏷️</span>
        <span>分類</span>
      </Link>
      <Link to="/import" className={`nav-item ${isActive('/import') ? 'active' : ''}`}>
        <span>📥</span>
        <span>取込</span>
      </Link>
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
          <Route path="/categorize" element={<Categorize />} />
        </Routes>
        <Nav />
      </div>
    </BrowserRouter>
  )
}
