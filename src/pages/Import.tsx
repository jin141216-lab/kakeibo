import { useState } from 'react'
import Papa from 'papaparse'
import { addTransaction, getTransactions, getCategoryMapping } from '../utils/storage'
import type { Category, PaymentMethod } from '../types'
import { CATEGORY_CONFIG } from '../types'

const KEYWORD_MAP: Record<string, Category> = {
  'マクドナルド': 'food', 'マック': 'food', 'すき家': 'food', '吉野家': 'food',
  'かすうどん': 'food', 'そば': 'food', 'うどん': 'food', '食堂': 'food',
  '焼肉': 'food', '居酒屋': 'food', 'スターバックス': 'food', 'スタバ': 'food',
  'カフェ': 'food', 'レストラン': 'food', '松屋': 'food', 'まつや': 'food',
  'セブン': 'food', 'ローソン': 'food', 'ファミマ': 'food', 'ファミリーマート': 'food',
  'イオン': 'food', 'スーパー': 'food',
  'Netflix': 'subscription', 'Spotify': 'subscription', 'プライム': 'subscription',
  'AMAZON': 'subscription', 'amazon': 'subscription', 'アマゾン': 'subscription',
  '楽天モバイル': 'utility', 'ドコモ': 'utility', 'au': 'utility', 'ソフトバンク': 'utility',
  'ガス': 'utility', '水道': 'utility', '電気': 'utility', '東京ガス': 'utility',
  '電力': 'utility', '光熱': 'utility',
  '電車': 'transport', 'バス': 'transport', 'タクシー': 'transport', 'サイクリング': 'transport',
  '薬': 'daily', 'ドラッグ': 'daily', 'クリニック': 'fixed', '病院': 'fixed',
  '保険': 'fixed', '家賃': 'fixed', 'ローン': 'fixed',
}

function guessCategory(shopName: string): Category {
  const mapping = getCategoryMapping()
  if (mapping[shopName]) return mapping[shopName] as Category
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (shopName.includes(keyword)) return category
  }
  return 'uncategorized'
}

function parseAmount(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, '') || '0')
}

interface PreviewRow {
  date: string
  shopName: string
  amount: number
  category: Category
  paymentMethod: PaymentMethod
  selected: boolean
  duplicate: boolean
}

export default function Import() {
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [imported, setImported] = useState(false)

  const handleFile = (file: File, method: PaymentMethod) => {
    Papa.parse(file, {
      encoding: 'UTF-8',
      complete: (result) => {
        const data = result.data as string[][]
        const existing = getTransactions()
        const rows: PreviewRow[] = []

        data.forEach((row, index) => {
          if (index === 0) return
          if (row.length < 3) return

          let date = '', shopName = '', amount = 0

          if (method === 'paypay') {
            const type = row[7] || ''
            if (type !== '支払い') return
            date = (row[0] || '').slice(0, 10).replace(/\//g, '-')
            shopName = (row[8] || '').split(' - ')[0].trim()
            amount = parseAmount(row[1] || '')
          } else {
            date = (row[0] || '').replace(/\//g, '-')
            shopName = (row[1] || '').replace(/ＶＩＳＡ国内利用　VS /, '').replace(/ＪＣＢ国内利用　QP  /, '').trim()
            amount = parseAmount(row[4] || '')
          }

          if (!date || !shopName || amount <= 0) return

          const duplicate = existing.some(t =>
            t.date === date && t.amount === amount && t.shopName === shopName
          )

          rows.push({
            date, shopName, amount,
            category: guessCategory(shopName),
            paymentMethod: method,
            selected: !duplicate,
            duplicate,
          })
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

  const selectedCount = preview.filter(r => r.selected).length
  const duplicateCount = preview.filter(r => r.duplicate).length

  return (
    <div className="page">
      <h1 className="page-title">CSV取込</h1>
      <div className="section-title">PayPay</div>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>PayPayアプリ → 残高・明細 → すべての履歴 → ダウンロード</p>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0], 'paypay')} />
      <div className="section-title">楽天カード</div>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>楽天カード会員サイト → ご利用明細 → 明細ダウンロード</p>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0], 'rakuten_card')} />
      {imported && <p className="success">取込が完了しました</p>}
      {preview.length > 0 && (
        <div>
          <div className="section-title">
            {preview.length}件中 {selectedCount}件を取込予定
            {duplicateCount > 0 && `（重複 ${duplicateCount}件は除外済み）`}
          </div>
          {preview.map((row, i) => (
            <div key={i} className={`transaction-row ${!row.selected ? 'dimmed' : ''}`}>
              <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} />
              <div className="t-info">
                <span style={{ fontSize: '13px' }}>{row.shopName}</span>
                <small>{row.date} {row.duplicate ? '⚠️ 重複' : ''}</small>
              </div>
              <select
                value={row.category}
                onChange={e => updateCategory(i, e.target.value as Category)}
                style={{ fontSize: '12px', padding: '4px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <span className="t-amount">¥{row.amount.toLocaleString()}</span>
            </div>
          ))}
          <button className="save-btn" onClick={handleImport}>{selectedCount}件を取込む</button>
        </div>
      )}
    </div>
  )
}
