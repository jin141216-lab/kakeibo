import { useState, useEffect } from 'react'
import { getUncategorized, updateTransaction, learnCategory } from '../utils/storage'
import type { Transaction, Category } from '../types'
import { CATEGORY_CONFIG } from '../types'

export default function Categorize() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selected, setSelected] = useState<Transaction | null>(null)

  const load = () => setTransactions(getUncategorized())

  useEffect(() => { load() }, [])

  const handleSave = (category: Category) => {
    if (!selected) return
    learnCategory(selected.shopName || '', category)
    updateTransaction({ ...selected, category })
    setSelected(null)
    load()
  }

  if (selected) {
    return (
      <div className="page">
        <div className="header">
          <button onClick={() => setSelected(null)}>&#8249;</button>
          <h1>カテゴリを選択</h1>
          <div />
        </div>
        <div className="transaction-row" style={{ marginBottom: '16px' }}>
          <div className="t-info">
            <span>{selected.shopName || 'unknown'}</span>
            <small>{selected.date} · ¥{selected.amount.toLocaleString()}</small>
          </div>
        </div>
        <div className="section-title">このお店のカテゴリ（以降自動分類されます）</div>
        <div className="category-grid">
          {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
            <button
              key={key}
              className="category-btn"
              onClick={() => handleSave(key)}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">未分類の取引</h1>
      {transactions.length === 0 ? (
        <p className="empty">未分類の取引はありません</p>
      ) : (
        <>
          <div className="section-title">{transactions.length}件が未分類です</div>
          {transactions.map(t => (
            <div
              key={t.id}
              className="transaction-row"
              onClick={() => setSelected(t)}
              style={{ cursor: 'pointer' }}
            >
              <span className="t-icon">📦</span>
              <div className="t-info">
                <span>{t.shopName || 'unknown'}</span>
                <small>{t.date} · ¥{t.amount.toLocaleString()}</small>
              </div>
              <span style={{ color: '#aaa', fontSize: '18px' }}>›</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
