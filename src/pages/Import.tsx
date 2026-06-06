import { useState } from 'react'
import Papa from 'papaparse'
import { addTransaction, getTransactions } from '../utils/storage'
import type { Category, PaymentMethod } from '../types'
import { CATEGORY_CONFIG } from '../types'

const KEYWORD_MAP: Record<string, Category> = {
  'マクドナルド': 'dining', 'マック': 'dining', 'すき家': 'dining', '吉野家': 'dining',
  'まつや': 'dining', '松屋': 'dining', 'かすうどん': 'dining', 'そば': 'dining',
  'うどん': 'dining', '食堂': 'dining', '焼肉': 'dining', '居酒屋': 'dining',
  'スターバックス': 'dining', 'スタバ': 'dining', 'カフェ': 'dining',
  'セブン': 'food', 'ローソン': 'food', 'ファミマ': 'food', 'ファミリーマート': 'food',
  'イオン': 'food', 'スーパー': 'food',
  'Netflix': 'subscription', 'Spotify': 'subscription', 'アマゾン': 'subscription',
  'AMAZON': 'subscription', 'amazon': 'subscription', 'プライム': 'subscription',
  '楽天モバイル': 'telecom', 'ドコモ': 'telecom', 'au': 'telecom', 'ソフトバンク': 'telecom',
  '薬': 'medical', 'クリニック': 'medical', '病院': 'medical', 'ドラッグ': 'medical',
  '電車': 'transport', 'バス': 'transport', 'タクシー': 'transport', 'サイクリング': 'transport',
  'ガス': 'telecom', '水道': 'telecom', '電気': 'telecom', '東京ガス': 'telecom',
}

function guessCategory(shopName: string): Category {
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (shopName.includes(keyword)) return category
  }
  return 'other'
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
  const [source, setSource] = useState<string>('')

  const handleFile = (file: File, method: PaymentMethod) => {
    setSource(method)
    Papa.parse(file, {
      encoding: 'UTF-8',
      complete: (result) => {
        const data = result.data as string[][]
        const existing = getTransactions()
        const rows: PreviewRow[] = []

        data.forEach((row, index) => {
          if (index === 0) return // ヘッダー行スキップ
          if (row.length < 3) return

          let date = '', shopName = '', amount = 0

          if (method === 'paypay') {
            // PayPay形式
            // 列: 取引日, 出金金額, 入金金額, ..., 取引内容, 取引先
            const type = row[7] || '' // 取引内容
            if (type !== '支払い') return // 支払い以外は除外
            date = (row[0] || '').slice(0, 10).replace(/\//g, '-')
            shopName = (row[8] || '').split(' - ')[0].trim()
            amount = parseAmount(row[1] || '')
          } else {
            // 楽天カード形式
            // 列: 利用日, 利用店名・商品名, 利用者, 支払方法, 利用金額
            date = (row[0] || '').replace(/\//g, '-')
            shopName = (row[1] || '').replace(/ＶＩＳＡ国内利用　VS /, '').replace(/ＪＣＢ国内利用　QP  /, '').trim()
            amount = parseAmount(row[4] || '')
          }

          if (!date || !shopName || amount <= 0) return

          // 重複チェック（同日・同金額・同店名）
          const duplicate = existing.some(t =>
            t.date === date && t.amount === amount && t.shopName === shopName
          )

          rows.push({
            date,
            shopName,
            amount,
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
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        PayPayアプリ → 残高・明細 → すべての履歴 → ダウンロード
      </p>
      <input type="file" accept=".csv" onChange={e => e.target.files && handleFile(e.target.files[0], 'paypay')} />

      <div className="section-title">楽天カード</div>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        楽天カード会員サイト → ご利用明細 → 明細ダウンロード
      </p>
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
          <button className="save-btn" onClick={handleImport}>
            {selectedCount}件を取込む
          </button>
        </div>
      )}
    </div>
  )
}
