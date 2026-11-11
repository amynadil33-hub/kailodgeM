import type { Currency } from './types'

export function formatMoney(amount: number, currency: Currency | string) {
  const value = Number.isFinite(amount) ? amount : 0
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** Approximate conversion line. Returns null when no admin-defined exchange rate exists. */
export function secondaryPrice(amount: number, base: Currency, usdToMvr: number | null) {
  if (!usdToMvr || usdToMvr <= 0) return null
  if (base === 'MVR') return formatMoney(Math.round((amount / usdToMvr) * 100) / 100, 'USD')
  return formatMoney(Math.round(amount * usdToMvr * 100) / 100, 'MVR')
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: iso.length === 10 ? 'UTC' : 'Indian/Maldives',
    ...opts,
  })
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Indian/Maldives',
  })
}

const DAY = 86_400_000

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function todayMaldives() {
  const now = new Date(Date.now() + 5 * 3_600_000)
  return now.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number) {
  return toISODate(new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY))
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return Math.round(
    (new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime()) / DAY,
  )
}

export function isISODate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
