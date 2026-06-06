import type { Transaction, Category } from '../types'

const KEY = 'kakeibo_transactions'
const MAPPING_KEY = 'kakeibo_category_mapping'

const CATEGORY_MIGRATION: Record<string, Category> = {
  dining: 'food',
  telecom: 'utility',
  medical: 'fixed',
}

function migrateCategory(category: string): Category {
  return (CATEGORY_MIGRATION[category] || category) as Category
}

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEY)
    const data: Transaction[] = raw ? JSON.parse(raw) : []
    return data.map(t => ({ ...t, category: migrateCategory(t.category) }))
  } catch {
    return []
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(KEY, JSON.stringify(transactions))
}

export function addTransaction(transaction: Transaction): void {
  saveTransactions([transaction, ...getTransactions()])
}

export function deleteTransaction(id: string): void {
  saveTransactions(getTransactions().filter(t => t.id !== id))
}

export function updateTransaction(updated: Transaction): void {
  saveTransactions(getTransactions().map(t => t.id === updated.id ? updated : t))
}

export function getMonthlyTransactions(year: number, month: number): Transaction[] {
  return getTransactions().filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
}

export function exportJSON(): void {
  const blob = new Blob([JSON.stringify(getTransactions(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kakeibo_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function getCategoryMapping(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MAPPING_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCategoryMapping(mapping: Record<string, string>): void {
  localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping))
}

export function learnCategory(shopName: string, category: string): void {
  const mapping = getCategoryMapping()
  mapping[shopName] = category
  saveCategoryMapping(mapping)
}

export function getUncategorized(): Transaction[] {
  return getTransactions().filter(t => t.category === 'uncategorized')
}
