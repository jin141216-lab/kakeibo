import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMonthlyTransactions, exportJSON } from '../utils/storage'
import type { Transaction } from '../types'
import { CATEGORY_CONFIG, PAYMENT_CONFIG } from '../types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setTransactions(getMonthlyTransactions(year, month))
  }, [year, month])

  const total = transactions.reduce((s, t) => s + t.amount, 0)

  const byPayment = {
    cash: transactions.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0),
    paypay: transactions.filter(t => t.paymentMethod === 'paypay').reduce((s, t) => s + t.amount, 0),
    rakuten_card: transactions.filter(t => t.paymentMethod === 'rakuten_card').reduce((s, t) => s + t.amount, 0),
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const pieData = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: transactions.filter(t => t.category === key).reduce((s, t) => s + t.amount, 0),
    color: cfg.color,
  })).filter(d => d.value > 0)

  return (
    <div className="page">
      <div className="header">
        <button onClick={prevMonth}>&#8249;</button>
        <h1>{year}年{month}月</h1>
        <button onClick={nextMonth}>&#8250;</button>
      </div>
      <div className="total-card">
        <p className="total-label">今月の支出</p>
        <p className="total-amount">¥{total.toLocaleString()}</p>
      </div>
      <div className="payment-grid">
        {(Object.entries(byPayment) as [keyof typeof byPayment, number][]).map(([key, amt]) => (
          <div key={key} className="payment-card">
            <span>{PAYMENT_CONFIG[key].icon} {PAYMENT_CONFIG[key].label}</span>
            <strong>¥{amt.toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <div className="section-title">最近の取引</div>
      {transactions.slice(0, 5).map(t => (
        <div key={t.id} className="transaction-row">
          <span className="t-icon">{CATEGORY_CONFIG[t.category].icon}</span>
          <div className="t-info">
            <span>{t.shopName || CATEGORY_CONFIG[t.category].label}</span>
            <small>{t.date}</small>
          </div>
          <span className="t-amount">¥{t.amount.toLocaleString()}</span>
        </div>
      ))}
      {transactions.length === 0 && (
        <p className="empty">まだ取引がありません</p>
      )}
      <button className="export-btn" onClick={exportJSON}>バックアップ</button>

      {pieData.length > 0 && (
        <>
          <div className="section-title">カテゴリ別割合</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props) => {
                  const pct = props.percent ?? 0
                  if (pct < 0.05) return ''
                  return `${Math.round(pct * 100)}%`
                }}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [`¥${Number(value).toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                <span style={{ color: '#666' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
