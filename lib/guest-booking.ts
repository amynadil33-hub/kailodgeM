import 'server-only'
import { hasServiceRole } from './env'
import { createServiceClient } from './supabase/service'
import type { BankAccount, Currency, PaymentStatus, Quote, RequestKind, RequestStatus, ReservationStatus } from './types'

export interface GuestBooking {
  id: string
  reference: string
  check_in: string
  check_out: string
  adults: number
  children: number
  currency: Currency
  reservation_status: ReservationStatus
  payment_status: PaymentStatus
  grand_total: number
  advance_amount: number
  hold_expires_at: string | null
  price_breakdown: Quote
  created_at: string
  room_type: { name: string; slug: string } | null
  customer: { full_name: string } | null
  requests: { id: string; kind: RequestKind; title: string; details: string | null; status: RequestStatus; amount: number | null }[]
  payments: { id: string; amount: number; status: 'pending' | 'verified' | 'rejected'; reference_note: string | null; created_at: string }[]
}

const TOKEN = /^[a-f0-9]{48}$/

/** Guest-facing view of a booking, looked up by its private token. Admin-only fields are never selected. */
export async function getGuestBooking(token: string): Promise<{ booking: GuestBooking; accounts: BankAccount[] } | null> {
  if (!TOKEN.test(token) || !hasServiceRole()) return null
  const sb = createServiceClient()
  await sb.rpc('expire_stale_holds')
  const { data } = await sb
    .from('bookings')
    .select(
      `id, reference, check_in, check_out, adults, children, currency, reservation_status, payment_status,
       grand_total, advance_amount, hold_expires_at, price_breakdown, created_at,
       room_type:room_types(name, slug),
       customer:customers(full_name),
       requests:booking_requests(id, kind, title, details, status, amount),
       payments(id, amount, status, reference_note, created_at)`,
    )
    .eq('access_token', token)
    .maybeSingle()
  if (!data) return null

  const { data: accounts } = await sb.from('bank_accounts').select('*').eq('active', true).order('sort')
  const booking = data as unknown as GuestBooking
  booking.grand_total = Number(booking.grand_total)
  booking.advance_amount = Number(booking.advance_amount)
  booking.payments = booking.payments.map((p) => ({ ...p, amount: Number(p.amount) }))
  booking.requests = booking.requests.map((r) => ({ ...r, amount: r.amount === null ? null : Number(r.amount) }))
  return { booking, accounts: (accounts ?? []) as BankAccount[] }
}
