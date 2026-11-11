import 'server-only'
import { getSiteData, type SiteData } from './data'
import { hasServiceRole } from './env'
import { addDays, isISODate, nightsBetween, todayMaldives } from './format'
import { buildQuote, discountIsApplicable } from './pricing'
import { createServiceClient } from './supabase/service'
import type { DecorationPackage, Discount, Fee, Quote, RatePeriod, RoomType } from './types'

export const MAX_NIGHTS = 90
export const MAX_ADVANCE_DAYS = 540

export interface StaySearch {
  checkIn: string
  checkOut: string
  adults: number
  children: number
}

export function parseStaySearch(input: Record<string, unknown>): StaySearch | { error: string } {
  const checkIn = input.checkIn
  const checkOut = input.checkOut
  const adults = Number(input.adults)
  const children = Number(input.children ?? 0)
  if (!isISODate(checkIn) || !isISODate(checkOut)) return { error: 'Please choose your check-in and check-out dates.' }
  const today = todayMaldives()
  if (checkIn < today) return { error: 'Check-in cannot be in the past.' }
  if (checkIn > addDays(today, MAX_ADVANCE_DAYS)) return { error: 'That date is too far ahead to book online.' }
  const nights = nightsBetween(checkIn, checkOut)
  if (nights < 1) return { error: 'Check-out must be after check-in.' }
  if (nights > MAX_NIGHTS)
    return { error: `Online bookings are limited to ${MAX_NIGHTS} nights — message us about extended stays.` }
  if (!Number.isInteger(adults) || adults < 1 || adults > 10) return { error: 'Please enter at least one adult.' }
  if (!Number.isInteger(children) || children < 0 || children > 10) return { error: 'Please check the number of children.' }
  return { checkIn, checkOut, adults, children }
}

export function fitsCapacity(rt: RoomType, s: StaySearch) {
  return s.adults <= rt.max_adults && s.children <= rt.max_children && s.adults + s.children <= rt.max_guests
}

export interface AvailabilityOption {
  roomType: RoomType
  available: boolean
  fits: boolean
  quote: Quote
}

async function availabilityMap(s: StaySearch): Promise<Map<string, number> | null> {
  if (!hasServiceRole()) return null
  const { data, error } = await createServiceClient().rpc('room_type_availability', {
    p_check_in: s.checkIn,
    p_check_out: s.checkOut,
  })
  if (error) throw new Error(`availability: ${error.message}`)
  return new Map(
    ((data ?? []) as { room_type_id: string; available_rooms: number }[]).map((r) => [r.room_type_id, r.available_rooms]),
  )
}

export function quoteForType(
  site: SiteData,
  rt: RoomType,
  s: StaySearch,
  opts: { discount?: Discount | null; packages?: DecorationPackage[] } = {},
) {
  return buildQuote({
    baseRate: rt.base_rate,
    ratePeriods: site.ratePeriods.filter((p) => p.room_type_id === rt.id),
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    currency: site.settings.base_currency,
    fees: site.fees,
    advancePercent: site.settings.advance_percent,
    discount: opts.discount,
    extras: (opts.packages ?? []).map((p) => ({ label: p.name, amount: Number(p.price ?? 0) })),
  })
}

export async function searchAvailability(s: StaySearch) {
  const site = await getSiteData()
  const map = await availabilityMap(s)
  const options: AvailabilityOption[] = site.roomTypes.map((rt) => ({
    roomType: rt,
    available: map ? (map.get(rt.id) ?? 0) > 0 : true,
    fits: fitsCapacity(rt, s),
    quote: quoteForType(site, rt, s),
  }))
  return { site, options }
}

const DEMO_DISCOUNT: Discount = {
  id: 'demo-discount',
  code: 'DEMO10',
  name: 'Demo offer — 10% off',
  kind: 'percent',
  value: 10,
  valid_from: null,
  valid_to: null,
  usage_limit: null,
  used_count: 0,
  min_nights: 1,
  active: true,
}

export async function findDiscount(code: string): Promise<Discount | null> {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,32}$/.test(normalized)) return null
  if (!hasServiceRole()) return normalized === DEMO_DISCOUNT.code ? DEMO_DISCOUNT : null
  const { data } = await createServiceClient().from('discounts').select('*').eq('code', normalized).maybeSingle()
  return (data as Discount | null) ?? null
}

export interface PricedSelection {
  site: SiteData
  roomType: RoomType
  search: StaySearch
  quote: Quote
  discount: Discount | null
  packages: DecorationPackage[]
}

/** Recomputes the full price on the server from the guest's selection. */
export async function priceSelection(input: {
  roomTypeId: string
  search: StaySearch
  discountCode?: string
  packageIds?: string[]
}): Promise<PricedSelection | { error: string }> {
  const site = await getSiteData()
  const roomType = site.roomTypes.find((t) => t.id === input.roomTypeId)
  if (!roomType) return { error: 'That room is no longer available.' }
  if (!fitsCapacity(roomType, input.search)) return { error: 'This room cannot accommodate that many guests.' }

  const packageIds = [...new Set((input.packageIds ?? []).slice(0, 10))]
  const packages = site.packages.filter((p) => packageIds.includes(p.id) && p.price !== null)

  let discount: Discount | null = null
  if (input.discountCode?.trim()) {
    discount = await findDiscount(input.discountCode)
    const problem = discount
      ? discountIsApplicable(discount, input.search.checkIn, nightsBetween(input.search.checkIn, input.search.checkOut), todayMaldives())
      : 'That code was not recognised.'
    if (problem) return { error: problem }
  }

  return {
    site,
    roomType,
    search: input.search,
    discount,
    packages,
    quote: quoteForType(site, roomType, input.search, { discount, packages }),
  }
}

export interface PriceSnapshot extends Quote {
  fees_snapshot: Fee[]
  discount_snapshot: Pick<Discount, 'id' | 'code' | 'name' | 'kind' | 'value'> | null
}

export function snapshotFor(sel: PricedSelection): PriceSnapshot {
  return {
    ...sel.quote,
    fees_snapshot: sel.site.fees,
    discount_snapshot: sel.discount
      ? {
          id: sel.discount.id,
          code: sel.discount.code,
          name: sel.discount.name,
          kind: sel.discount.kind,
          value: sel.discount.value,
        }
      : null,
  }
}

/** Rebuilds a stored booking's totals after an accepted quote or extra, using the prices locked in at booking time. */
export function recalculateFromSnapshot(
  snapshot: PriceSnapshot,
  checkIn: string,
  checkOut: string,
  extras: { label: string; amount: number }[],
): PriceSnapshot {
  const ratePeriods: RatePeriod[] = snapshot.nightly.map((n, i) => ({
    id: `n${i}`,
    room_type_id: '',
    starts_on: n.date,
    ends_on: n.date,
    nightly_rate: n.rate,
    label: null,
  }))
  const discount = snapshot.discount_snapshot
    ? ({ ...snapshot.discount_snapshot, active: true } as Discount)
    : null
  const quote = buildQuote({
    baseRate: snapshot.nightly[0]?.rate ?? 0,
    ratePeriods,
    checkIn,
    checkOut,
    currency: snapshot.currency,
    fees: snapshot.fees_snapshot ?? [],
    advancePercent: snapshot.advance_percent,
    discount,
    extras,
  })
  return { ...quote, fees_snapshot: snapshot.fees_snapshot ?? [], discount_snapshot: snapshot.discount_snapshot }
}

export async function recalculateBookingTotals(bookingId: string, client = createServiceClient()) {
  const { data: booking } = await client
    .from('bookings')
    .select('id, check_in, check_out, price_breakdown')
    .eq('id', bookingId)
    .single()
  if (!booking) return
  const { data: requests } = await client
    .from('booking_requests')
    .select('title, amount, counts_towards_total, status')
    .eq('booking_id', bookingId)
  const extras = (requests ?? [])
    .filter((r) => r.counts_towards_total && r.amount !== null && !['declined', 'cancelled'].includes(r.status))
    .map((r) => ({ label: r.title as string, amount: Number(r.amount) }))
  const next = recalculateFromSnapshot(booking.price_breakdown as PriceSnapshot, booking.check_in, booking.check_out, extras)
  await client
    .from('bookings')
    .update({
      room_subtotal: next.room_subtotal,
      discount_total: next.discount_total,
      extras_total: next.extras_total,
      fees_total: next.fees_total,
      grand_total: next.grand_total,
      advance_amount: next.advance_amount,
      price_breakdown: next,
    })
    .eq('id', bookingId)
  await client.rpc('refresh_booking_payment', { p_booking_id: bookingId })
}
