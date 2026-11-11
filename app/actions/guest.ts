'use server'

import { revalidatePath } from 'next/cache'
import {
  parseStaySearch,
  priceSelection,
  recalculateBookingTotals,
  snapshotFor,
} from '@/lib/booking-server'
import { hasServiceRole } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/service'
import type { Quote, RequestKind } from '@/lib/types'

const clean = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9 ()-]{6,20}$/
const TOKEN = /^[a-f0-9]{48}$/

export interface QuoteRequest {
  roomTypeId: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  discountCode?: string
  packageIds?: string[]
}

export async function getQuote(input: QuoteRequest): Promise<{ quote: Quote; discountName: string | null } | { error: string }> {
  if (!(await rateLimit('quote', 120, 60_000))) return { error: 'Too many requests. Please wait a moment.' }
  const search = parseStaySearch(input as unknown as Record<string, unknown>)
  if ('error' in search) return search
  const priced = await priceSelection({
    roomTypeId: clean(input.roomTypeId, 64),
    search,
    discountCode: clean(input.discountCode, 32),
    packageIds: Array.isArray(input.packageIds) ? input.packageIds.map((p) => clean(p, 64)) : [],
  })
  if ('error' in priced) return priced
  return { quote: priced.quote, discountName: priced.discount?.name ?? null }
}

export interface BookingSubmission extends QuoteRequest {
  fullName: string
  email: string
  phone: string
  country: string
  arrivalDetails: string
  specialRequests: string
  customRequests: { kind: RequestKind; details: string }[]
  website?: string
}

export type BookingResult =
  | { ok: true; token: string; reference: string }
  | { ok: true; demo: true; reference: string; quote: Quote }
  | { ok: false; error: string }

const CUSTOM_KINDS: RequestKind[] = [
  'custom_decoration',
  'airport_transfer',
  'early_check_in',
  'late_check_out',
  'extended_stay',
  'other',
]

const CUSTOM_TITLES: Record<string, string> = {
  custom_decoration: 'Custom decoration',
  airport_transfer: 'Airport transfer',
  early_check_in: 'Early check-in',
  late_check_out: 'Late check-out',
  extended_stay: 'Extended / monthly stay',
  other: 'Special request',
}

export async function createBooking(input: BookingSubmission): Promise<BookingResult> {
  if (clean(input.website)) return { ok: false, error: 'Something went wrong. Please try again.' }
  if (!(await rateLimit('booking', 8, 10 * 60_000)))
    return { ok: false, error: 'Too many booking attempts. Please wait a few minutes or message us on WhatsApp.' }

  const fullName = clean(input.fullName, 120)
  const email = clean(input.email, 160).toLowerCase()
  const phone = clean(input.phone, 24)
  if (fullName.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Please enter a valid email address.' }
  if (!PHONE.test(phone)) return { ok: false, error: 'Please enter a valid phone or WhatsApp number.' }

  const search = parseStaySearch(input as unknown as Record<string, unknown>)
  if ('error' in search) return { ok: false, error: search.error }

  const priced = await priceSelection({
    roomTypeId: clean(input.roomTypeId, 64),
    search,
    discountCode: clean(input.discountCode, 32),
    packageIds: Array.isArray(input.packageIds) ? input.packageIds.map((p) => clean(p, 64)) : [],
  })
  if ('error' in priced) return { ok: false, error: priced.error }

  const requests = [
    ...priced.packages.map((p) => ({
      kind: 'package',
      package_id: p.id,
      title: p.name,
      status: 'included',
      amount: p.price,
      counts_towards_total: true,
    })),
    ...(Array.isArray(input.customRequests) ? input.customRequests : [])
      .filter((r) => CUSTOM_KINDS.includes(r.kind))
      .slice(0, 6)
      .map((r) => ({
        kind: r.kind,
        title: CUSTOM_TITLES[r.kind],
        details: clean(r.details, 1000),
        status: 'quote_pending',
        counts_towards_total: false,
      })),
  ]

  if (!hasServiceRole() || priced.site.demo) {
    return { ok: true, demo: true, reference: 'KL-DEMO00', quote: priced.quote }
  }

  const { data, error } = await createServiceClient().rpc('create_booking', {
    p_room_type_id: priced.roomType.id,
    p_check_in: search.checkIn,
    p_check_out: search.checkOut,
    p_adults: search.adults,
    p_children: search.children,
    p_customer: { full_name: fullName, email, phone, country: clean(input.country, 80) },
    p_totals: snapshotFor(priced),
    p_requests: requests,
    p_discount_id: priced.discount?.id ?? null,
    p_source: 'website',
    p_status: 'pending',
    p_hold_hours: priced.site.settings.payment_deadline_hours,
    p_special_requests: clean(input.specialRequests, 2000) || null,
    p_arrival_details: clean(input.arrivalDetails, 1000) || null,
  })

  if (error) {
    if (error.message.includes('no rooms available'))
      return { ok: false, error: 'Sorry — that room was just booked for these dates. Please choose another room or dates.' }
    if (error.message.includes('discount'))
      return { ok: false, error: 'That offer code is no longer available.' }
    console.error('[kai-lodge] create_booking failed', error)
    return { ok: false, error: 'We could not complete your booking. Please try again or message us on WhatsApp.' }
  }

  const row = (Array.isArray(data) ? data[0] : data) as { access_token: string; reference: string }
  return { ok: true, token: row.access_token, reference: row.reference }
}

async function bookingIdForToken(token: string) {
  if (!TOKEN.test(token) || !hasServiceRole()) return null
  const { data } = await createServiceClient()
    .from('bookings')
    .select('id, currency, reservation_status')
    .eq('access_token', token)
    .maybeSingle()
  return data as { id: string; currency: string; reservation_status: string } | null
}

export async function submitPaymentReference(
  token: string,
  input: { amount: number; reference: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!(await rateLimit('payref', 10, 10 * 60_000))) return { ok: false, error: 'Too many attempts. Please wait.' }
  const booking = await bookingIdForToken(token)
  if (!booking) return { ok: false, error: 'Booking not found.' }
  if (['cancelled', 'expired'].includes(booking.reservation_status))
    return { ok: false, error: 'This booking is no longer active. Please contact us.' }
  const amount = Math.round(Number(input.amount) * 100) / 100
  const note = clean(input.reference, 200)
  if (!(amount > 0) || amount > 10_000_000) return { ok: false, error: 'Please enter the amount you transferred.' }
  if (note.length < 3) return { ok: false, error: 'Please enter your transfer reference.' }

  const { error } = await createServiceClient().from('payments').insert({
    booking_id: booking.id,
    kind: 'advance',
    amount,
    currency: booking.currency,
    method: 'bank_transfer',
    status: 'pending',
    reference_note: note,
  })
  if (error) return { ok: false, error: 'Could not save your payment details. Please try again.' }
  revalidatePath(`/booking/${token}`)
  return { ok: true }
}

export async function respondToQuote(token: string, requestId: string, accept: boolean) {
  const booking = await bookingIdForToken(token)
  if (!booking) return { ok: false, error: 'Booking not found.' }
  const sb = createServiceClient()
  const { data: updated, error } = await sb
    .from('booking_requests')
    .update({
      status: accept ? 'accepted' : 'declined',
      counts_towards_total: accept,
      guest_responded_at: new Date().toISOString(),
    })
    .eq('id', clean(requestId, 64))
    .eq('booking_id', booking.id)
    .eq('status', 'quoted')
    .select('id')
  if (error || !updated?.length) return { ok: false, error: 'This quote can no longer be changed.' }
  await recalculateBookingTotals(booking.id, sb)
  revalidatePath(`/booking/${token}`)
  return { ok: true }
}

export async function sendEnquiry(input: {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  website?: string
}): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  if (clean(input.website)) return { ok: true }
  if (!(await rateLimit('enquiry', 5, 10 * 60_000))) return { ok: false, error: 'Too many messages. Please try later.' }
  const name = clean(input.name, 120)
  const email = clean(input.email, 160)
  const phone = clean(input.phone, 24)
  const message = clean(input.message, 3000)
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' }
  if (!EMAIL.test(email) && !PHONE.test(phone)) return { ok: false, error: 'Please add an email or phone number.' }
  if (message.length < 5) return { ok: false, error: 'Please write a short message.' }
  if (!hasServiceRole()) return { ok: true, demo: true }
  const { error } = await createServiceClient().from('enquiries').insert({
    name,
    email: email || null,
    phone: phone || null,
    subject: clean(input.subject, 160) || null,
    message,
  })
  if (error) return { ok: false, error: 'Could not send your message. Please try WhatsApp instead.' }
  return { ok: true }
}
