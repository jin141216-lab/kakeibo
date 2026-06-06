import { useState } from 'react'
import Papa from 'papaparse'
import { addTransaction } from '../utils/storage'
import type { Category, PaymentMethod } from '../types'
import { CATEGORY_CONFIG } from '../types'

const KEYWORD_MAP: Record<string, Category> = {
  'マクドナルド': 'dining', 'マック': 'dining', 'すき家': 'dining', '吉野家': 'dining',
  'セブン': 'food', 'ローソン': 'food', 'ファミマ': 'food', 'イオン': 'food',
  'Netflix': 'subscription', 'Spotify': 'subscription', 'アマゾン': 'subscription',
  'ドコモ': 'telecom', 'au': 'telecom', 'ソフトバンク': 'telecom',
  '薬': 'medical', 'クリニック': 'medical', '病院': 'medical',
  '電車': 'transport', 'バス': 'transport', 'タクシー': 'transport',
}

function guessCategory(shopName: string): Category {
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (shopName.includes(keyword)) return category
  }
  return 'other'
}

interface PreviewRow {
  date: string
  shopName: string
  amount: number
  category: Category
  paymentMethod: PaymentMethod
  selected: boolean
}

export default function Import() {
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [imported, setImported] = useState(false)

  const handleFile = (file: File, method: PaymentMethod) => {
    Papa.parse(file, {
      encoding: 'UTF-8',
      complete: (result) => {
        const rows: PreviewRow[] = []
        const data = result.data as string[][]
        data.forEach((row) => {
          if (row.length < 3) return
          let date = '', shopName = '', amountStr = ''
          if (method === 'paypay') {
            date = row[0]?.slice(0, 10) || ''
            shopName = row[1] || ''
            amountStr = row[2]?.replace(/[^0-9]/g, '') || ''
          } else {
            date = row[0]?.slice(0, 10) || ''
            shopName = row[1] || ''
            amountStr = row[3]?.replace(/[^0-9]/g, '') || ''
          }
          const amount = parseInt(amountStr)
          if (!date || !shopName || isNaN(amount) || amount <= 0) return
          rows.push({ date, shopName, amount, category: guessCategory(shopName), paymentMethod: method, selected: true })
        })
        setPreview(rows)
        setImported(false)
      }
    })
  }

  const toggleRow = (i: number) => {
    setPreview(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))
  }

  const updateCategory = (i: number, category: Category) => {
    setPreview(prev => prev.map((r, idx) => idx === i ? { ...r, category } : r))
  }

  const handleImport = () => {
    preview.filter(r => r.selected).forEach(r => {
      addTransaction({
        id: crypto.randomUUID(),
        date: r.date,
        amount: r.amount,
        category: r.category,
        paymentMethod: r.paymentMethod,
        shopName: r.shopName,
        importedFrom: r.paymentMethod as 'paypay' | 'rakuten_card',
        createdAt: new Date().toISOString(),
      })
    })
    setImported(true)
    setPreview([])
  }

  return (
    <div className="page">
      <h1 className="page-title">CSV取込</h1>
      <div className="section-title">PayPay</div>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0], 'paypay')} />
      <div className="section-title">楽天カード</div>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0], 'rakuten_card')} />
      {imported && <p className="success">取込が完了しました</p>}
      {preview.length > 0 && (
        <div>
          <div className="section-title">{preview.length}件のプレビュー</div>
          {preview.map((row, i) => (
            <div key={i} className={`transaction-row ${!row.selected ? 'dimmed' : ''}`}>
              <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} />
              <div className="t-info">
                <span>{row.shopName}</span>
                <small>{row.date}</small>
              </div>
              <select value={row.category} onChange={e => updateCategory(i, e.target.value as Category)} className="filter-select" style={{ width: 'auto', fontSize: '12px' }}>
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <span className="t-amount">¥{row.amount.toLocaleString()}</span>
            </div>
          ))}
          <button className="save-btn" onClick={handleImport}>{preview.filter(r => r.selected).length}件を取込む</button>
        </div>
      )}
    </div>
  )
}
