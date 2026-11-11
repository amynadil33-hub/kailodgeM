import { addDays, nightsBetween } from './format'
import type { Currency, Discount, Fee, Quote, QuoteLine, RatePeriod } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

export interface QuoteInput {
  baseRate: number
  ratePeriods: RatePeriod[]
  checkIn: string
  checkOut: string
  currency: Currency
  fees: Fee[]
  advancePercent: number
  discount?: Discount | null
  extras?: { label: string; amount: number }[]
}

export function nightlyRates(baseRate: number, periods: RatePeriod[], checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut)
  return Array.from({ length: nights }, (_, i) => {
    const date = addDays(checkIn, i)
    const period = periods.find((p) => p.starts_on <= date && date <= p.ends_on)
    return { date, rate: round2(period ? Number(period.nightly_rate) : Number(baseRate)) }
  })
}

export function discountIsApplicable(discount: Discount, checkIn: string, nights: number, today: string) {
  if (!discount.active) return 'This code is not active.'
  if (discount.valid_from && today < discount.valid_from) return 'This code is not valid yet.'
  if (discount.valid_to && checkIn > discount.valid_to) return 'This code has expired for these dates.'
  if (discount.usage_limit !== null && discount.used_count >= discount.usage_limit)
    return 'This code has reached its usage limit.'
  if (nights < (discount.min_nights || 1)) return `This code needs a stay of at least ${discount.min_nights} nights.`
  return null
}

/**
 * Single source of truth for prices. Runs on the server for every quote and booking;
 * the client only ever displays the result.
 */
export function buildQuote(input: QuoteInput): Quote {
  const nightly = nightlyRates(input.baseRate, input.ratePeriods, input.checkIn, input.checkOut)
  const nights = nightly.length
  const lines: QuoteLine[] = []

  const roomSubtotal = round2(nightly.reduce((s, n) => s + n.rate, 0))
  const uniform = nightly.every((n) => n.rate === nightly[0]?.rate)
  lines.push({
    label: uniform
      ? `${nights} night${nights === 1 ? '' : 's'} × ${nightly[0]?.rate ?? 0}`
      : `${nights} nights (varying nightly rates)`,
    amount: roomSubtotal,
    kind: 'room',
  })

  let discountTotal = 0
  if (input.discount) {
    discountTotal =
      input.discount.kind === 'percent'
        ? round2((roomSubtotal * Math.min(Number(input.discount.value), 100)) / 100)
        : round2(Math.min(Number(input.discount.value), roomSubtotal))
    if (discountTotal > 0)
      lines.push({ label: `Offer: ${input.discount.name}`, amount: -discountTotal, kind: 'discount' })
  }

  const extras = (input.extras ?? []).filter((e) => e.amount > 0)
  const extrasTotal = round2(extras.reduce((s, e) => s + e.amount, 0))
  for (const e of extras) lines.push({ label: e.label, amount: round2(e.amount), kind: 'extra' })

  const taxable = roomSubtotal - discountTotal + extrasTotal
  let feesTotal = 0
  for (const fee of [...input.fees].filter((f) => f.active).sort((a, b) => a.sort - b.sort)) {
    const amount =
      fee.kind === 'percent'
        ? round2((taxable * Number(fee.amount)) / 100)
        : fee.kind === 'per_night'
          ? round2(Number(fee.amount) * nights)
          : round2(Number(fee.amount))
    feesTotal += amount
    const suffix = fee.kind === 'percent' ? ` (${fee.amount}%)` : fee.kind === 'per_night' ? ' (per night)' : ''
    lines.push({ label: `${fee.name}${suffix}`, amount, kind: 'fee' })
  }
  feesTotal = round2(feesTotal)

  const grandTotal = round2(taxable + feesTotal)
  const pct = Math.max(0, Math.min(100, Number(input.advancePercent)))
  const advance = round2((grandTotal * pct) / 100)

  return {
    currency: input.currency,
    nights,
    nightly,
    room_subtotal: roomSubtotal,
    discount_total: discountTotal,
    extras_total: extrasTotal,
    fees_total: feesTotal,
    grand_total: grandTotal,
    advance_percent: pct,
    advance_amount: advance,
    balance_amount: round2(grandTotal - advance),
    lines,
  }
}
