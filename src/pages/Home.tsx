import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMonthlyTransactions, exportJSON } from '../utils/storage'
import type { Transaction } from '../types'
import { CATEGORY_CONFIG, PAYMENT_CONFIG } from '../types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number, cy: number, midAngle: number, innerRadius: number, outerRadius: number, percent: number
  }) => {
    if ((percent ?? 0) < 0.06) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${Math.round((percent ?? 0) * 100)}%`}
      </text>
    )
  }

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

      {pieData.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '8px' }}>
          <div className="section-title" style={{ margin: '0 0 8px 0' }}>カテゴリ別割合</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [`¥${Number(value).toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: '#444' }}>{d.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>¥{d.value.toLocaleString()}</span>
                <span style={{ fontSize: '12px', color: '#aaa', minWidth: '36px', textAlign: 'right' }}>
                  {total > 0 ? `${Math.round(d.value / total * 100)}%` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  )
}
