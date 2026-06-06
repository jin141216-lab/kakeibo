import type { Transaction } from '../types'

const KEY = 'kakeibo_transactions'

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getMonthlyTransactions(year: number, month: number): Transaction[] {
  return getTransactions().filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
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

export function exportJSON(): void {
  const blob = new Blob([JSON.stringify(getTransactions(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kakeibo_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
