import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { getMonthlyTransactions } from '../utils/storage'
import type { Transaction } from '../types'
import { CATEGORY_CONFIG } from '../types'

export default function Analytics() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setTransactions(getMonthlyTransactions(year, month))
  }, [year, month])

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

  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const total = getMonthlyTransactions(y, m).reduce((s, t) => s + t.amount, 0)
    return { name: `${m}月`, total }
  }).reverse()

  return (
    <div className="page">
      <div className="header">
        <button onClick={prevMonth}>&#8249;</button>
        <h1>{year}年{month}月の分析</h1>
        <button onClick={nextMonth}>&#8250;</button>
      </div>
      {pieData.length === 0 ? (
        <p className="empty">データがありません</p>
      ) : (
        <div>
          <div className="section-title">カテゴリ別</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${Math.round((percent as number) * 100)}%`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => `¥${(value as number).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="section-title">カテゴリ内訳</div>
          {pieData.map(d => (
            <div key={d.name} className="category-row">
              <span style={{ color: d.color }}>*</span>
              <span>{d.name}</span>
              <span className="t-amount">¥{d.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <div className="section-title">過去6ヶ月の推移</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={barData}>
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => `¥${((v as number) / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => `¥${(value as number).toLocaleString()}`} />
          <Bar dataKey="total" fill="#4CAF50" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
