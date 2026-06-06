import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addTransaction } from '../utils/storage'
import type { Category, PaymentMethod } from '../types'
import { CATEGORY_CONFIG, PAYMENT_CONFIG } from '../types'

export default function Add() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState('')

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) return
    addTransaction({
      id: crypto.randomUUID(),
      date,
      amount: Math.round(Number(amount)),
      category,
      paymentMethod,
      memo,
      createdAt: new Date().toISOString(),
    })
    navigate('/')
  }

  return (
    <div className="page">
      <div className="header">
        <button onClick={() => navigate('/')}>&#8249;</button>
        <h1>支出を追加</h1>
        <div />
      </div>
      <div className="amount-input-wrap">
        <span className="yen">¥</span>
        <input
          className="amount-input"
          type="number"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
      </div>
      <div className="section-title">カテゴリ</div>
      <div className="category-grid">
        {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
          <button
            key={key}
            className={`category-btn ${category === key ? 'selected' : ''}`}
            onClick={() => setCategory(key)}
          >
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </button>
        ))}
      </div>
      <div className="section-title">支払い方法</div>
      <div className="payment-select">
        {(Object.entries(PAYMENT_CONFIG) as [PaymentMethod, typeof PAYMENT_CONFIG[PaymentMethod]][]).map(([key, cfg]) => (
          <button
            key={key}
            className={`payment-btn ${paymentMethod === key ? 'selected' : ''}`}
            onClick={() => setPaymentMethod(key)}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>
      <div className="section-title">日付</div>
      <input
        className="date-input"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />
      <div className="section-title">メモ（任意）</div>
      <input
        className="memo-input"
        type="text"
        placeholder="店名など"
        value={memo}
        onChange={e => setMemo(e.target.value)}
      />
      <button className="save-btn" onClick={handleSave}>保存する</button>
    </div>
  )
}
