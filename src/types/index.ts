export type PaymentMethod = 'cash' | 'paypay' | 'rakuten_card'

export type Category =
  | 'food'
  | 'dining'
  | 'transport'
  | 'telecom'
  | 'entertainment'
  | 'subscription'
  | 'daily'
  | 'medical'
  | 'other'

export interface Transaction {
  id: string
  date: string
  amount: number
  category: Category
  paymentMethod: PaymentMethod
  memo?: string
  shopName?: string
  importedFrom?: 'paypay' | 'rakuten_card'
  createdAt: string
}

export const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; color: string }> = {
  food:          { label: '食費',   icon: '🛒', color: '#4CAF50' },
  dining:        { label: '外食',   icon: '🍜', color: '#FF9800' },
  transport:     { label: '交通費', icon: '🚃', color: '#2196F3' },
  telecom:       { label: '通信費', icon: '📱', color: '#9C27B0' },
  entertainment: { label: '娯楽',   icon: '🎮', color: '#E91E63' },
  subscription:  { label: 'サブスク', icon: '📺', color: '#00BCD4' },
  daily:         { label: '日用品', icon: '🧴', color: '#795548' },
  medical:       { label: '医療',   icon: '💊', color: '#F44336' },
  other:         { label: 'その他', icon: '📦', color: '#607D8B' },
}

export const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; icon: string }> = {
  cash:          { label: '現金',     icon: '💴' },
  paypay:        { label: 'PayPay',   icon: '🔴' },
  rakuten_card:  { label: '楽天カード', icon: '💳' },
}