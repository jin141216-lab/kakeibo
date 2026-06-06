import { useState, useEffect } from 'react'
import { getMonthlyTransactions, getTransactions, deleteTransaction } from '../utils/storage'
import type { Transaction, Category } from '../types'
import { CATEGORY_CONFIG, PAYMENT_CONFIG } from '../types'

export default function Transactions() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [showAll, setShowAll] = useState(false)

  const load = () => {
    if (showAll) {
      setTransactions(getTransactions())
    } else {
      setTransactions(getMonthlyTransactions(year, month))
    }
  }

  useEffect(() => { load() }, [year, month, showAll])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const handleDelete = (id: string) => {
    if (!confirm('削除しますか？')) return
    deleteTransaction(id)
    load()
  }

  const filtered = filterCategory === 'all'
    ? transactions
    : transactions.filter(t => t.category === filterCategory)

  return (
    <div className="page">
      <div className="header">
        {!showAll && <button onClick={prevMonth}>&#8249;</button>}
        {showAll && <div />}
        <h1>{showAll ? '全期間' : `${year}年${month}月`}の明細</h1>
        {!showAll && <button onClick={nextMonth}>&#8250;</button>}
        {showAll && <div />}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={() => setShowAll(false)}
          style={{
            flex: 1, padding: '8px', borderRadius: '12px', border: 'none',
            background: !showAll ? '#4CAF50' : 'white',
            color: !showAll ? 'white' : '#888',
            fontSize: '13px', cursor: 'pointer'
          }}
        >月別</button>
        <button
          onClick={() => setShowAll(true)}
          style={{
            flex: 1, padding: '8px', borderRadius: '12px', border: 'none',
            background: showAll ? '#4CAF50' : 'white',
            color: showAll ? 'white' : '#888',
            fontSize: '13px', cursor: 'pointer'
          }}
        >全期間</button>
      </div>

      <select
        className="filter-select"
        value={filterCategory}
        onChange={e => setFilterCategory(e.target.value as Category | 'all')}
      >
        <option value="all">すべてのカテゴリ</option>
        {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
        ))}
      </select>

      <div className="section-title">
        {filtered.length}件 · 合計¥{filtered.reduce((s, t) => s + t.amount, 0).toLocaleString()}
      </div>

      {filtered.length === 0 && <p className="empty">取引がありません</p>}

      {filtered.map(t => (
        <div key={t.id} className="transaction-row">
          <span className="t-icon">{CATEGORY_CONFIG[t.category].icon}</span>
          <div className="t-info">
            <span>{t.shopName || t.memo || CATEGORY_CONFIG[t.category].label}</span>
            <small>{t.date} · {PAYMENT_CONFIG[t.paymentMethod].label}</small>
          </div>
          <span className="t-amount">¥{t.amount.toLocaleString()}</span>
          <button className="delete-btn" onClick={() => handleDelete(t.id)}>🗑</button>
        </div>
      ))}
    </div>
  )
}
