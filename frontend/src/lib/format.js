const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

export const NUMERIC_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 246])

export function formatNumber(value) {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(numeric)) return String(value)
  return numberFormatter.format(numeric)
}

export function formatCell(value, type) {
  if (value === null || value === undefined) return '—'
  if (NUMERIC_TYPES.has(type)) return formatNumber(value)
  return String(value)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date)
}
