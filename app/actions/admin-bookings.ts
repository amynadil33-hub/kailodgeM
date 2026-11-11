'use server'

import { revalidatePath } from 'next/cache'
import { adminForAction, AdminActionError } from '@/lib/admin/auth'
import {
  parseStaySearch,
  priceSelection,
  recalculateBookingTotals,
  snapshotFor,
  type PriceSnapshot,
} from '@/lib/booking-server'
import { getSiteData } from '@/lib/data'
import { isISODate, nightsBetween } from '@/lib/format'
import { nightlyRates } from '@/lib/pricing'

type Result = { ok: true; message?: string; id?: string } | { ok: false; error: string }

const UUID = /^[0-9a-f-]{36}$/i

function fail(error: unknown): Result {
  if (error instanceof AdminActionError) return { ok: false, error: error.message }
  const e = error as { code?: string; message?: string }
  const msg = e?.message ?? ''
  if (msg.includes('no rooms available') || e?.code === '23P01') {
    return { ok: false, error: 'That room is already occupied for some of those nights.' }
  }
  if (msg.includes('can no longer be amended')) return { ok: false, error: 'This booking can no longer be amended.' }
  if (msg.includes('check-out must be after')) return { ok: false, error: 'Check-out must be after check-in.' }
  console.error('[admin] booking action failed', e?.code, msg)
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

function clean(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function refresh(bookingId?: string) {
  revalidatePath('/admin', 'layout')
  if (bookingId) revalidatePath(`/admin/reservations/${bookingId}`)
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show', 'pending'],
  checked_in: ['checked_out', 'confirmed'],
  checked_out: ['checked_in'],
  cancelled: ['pending'],
  expired: ['pending'],
  no_show: ['pending', 'confirmed'],
}

export async function setReservationStatus(bookingId: string, next: string): Promise<Result> {
  try {
    if (!UUID.test(bookingId)) return { ok: false, error: 'Unknown booking.' }
    const { supabase } = await adminForAction()
    const { data: booking, error: readError } = await supabase
      .from('bookings')
      .select('reservation_status')
      .eq('id', bookingId)
      .single()
    if (readError || !booking) return { ok: false, error: 'Booking not found.' }

    const current = booking.reservation_status as string
    if (!STATUS_TRANSITIONS[current]?.includes(next)) {
      return { ok: false, error: `A ${current.replace('_', ' ')} booking cannot be moved to ${next.replace('_', ' ')}.` }
    }

    if (['cancelled', 'expired', 'no_show'].includes(current)) {
      const { error } = await supabase.rpc('restore_booking', { p_booking_id: bookingId })
      if (error) return fail(error)
      if (next !== 'pending') {
        const { error: e2 } = await supabase.from('bookings').update({ reservation_status: next }).eq('id', bookingId)
        if (e2) return fail(e2)
      }
    } else {
      const patch: Record<string, unknown> = { reservation_status: next }
      if (next === 'confirmed') {
        patch.confirmed_at = new Date().toISOString()
        patch.hold_expires_at = null
      }
      if (next === 'cancelled') patch.cancelled_at = new Date().toISOString()
      const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId)
      if (error) return fail(error)
    }
    refresh(bookingId)
    return { ok: true, message: 'Reservation updated.' }
  } catch (e) {
    return fail(e)
  }
}

export async function reassignRoom(bookingId: string, roomId: string): Promise<Result> {
  try {
    if (!UUID.test(bookingId) || !UUID.test(roomId)) return { ok: false, error: 'Invalid room.' }
    const { supabase } = await adminForAction()
    const { error } = await supabase.rpc('reassign_booking_room', { p_booking_id: bookingId, p_room_id: roomId })
    if (error) return fail(error)
    refresh(bookingId)
    return { ok: true, message: 'Room reassigned.' }
  } catch (e) {
    return fail(e)
  }
}

/** Moves the stay and re-prices the room nights at today's rates, keeping the original discount, fees and extras. */
export async function amendDates(bookingId: string, checkIn: string, checkOut: string): Promise<Result> {
  try {
    if (!UUID.test(bookingId)) return { ok: false, error: 'Unknown booking.' }
    if (!isISODate(checkIn) || !isISODate(checkOut)) return { ok: false, error: 'Please choose valid dates.' }
    const nights = nightsBetween(checkIn, checkOut)
    if (nights < 1 || nights > 90) return { ok: false, error: 'A stay must be between 1 and 90 nights.' }

    const { supabase } = await adminForAction()
    const { data: booking } = await supabase
      .from('bookings')
      .select('room_type_id, price_breakdown, room_types(base_rate)')
      .eq('id', bookingId)
      .single()
    if (!booking) return { ok: false, error: 'Booking not found.' }

    const { error } = await supabase.rpc('amend_booking_dates', {
      p_booking_id: bookingId,
      p_check_in: checkIn,
      p_check_out: checkOut,
    })
    if (error) return fail(error)

    const { data: periods } = await supabase.from('rate_periods').select('*').eq('room_type_id', booking.room_type_id)
    const roomType = (Array.isArray(booking.room_types) ? booking.room_types[0] : booking.room_types) as { base_rate: number } | null
    const snapshot = booking.price_breakdown as PriceSnapshot
    const repriced: PriceSnapshot = {
      ...snapshot,
      nightly: nightlyRates(Number(roomType?.base_rate ?? snapshot.nightly[0]?.rate ?? 0), periods ?? [], checkIn, checkOut),
    }
    const { error: snapError } = await supabase.from('bookings').update({ price_breakdown: repriced }).eq('id', bookingId)
    if (snapError) return fail(snapError)
    await recalculateBookingTotals(bookingId, supabase)

    refresh(bookingId)
    return { ok: true, message: 'Dates amended and totals recalculated.' }
  } catch (e) {
    return fail(e)
  }
}

export async function saveBookingNotes(
  bookingId: string,
  values: { admin_notes?: string; arrival_details?: string; special_requests?: string },
): Promise<Result> {
  try {
    const { supabase } = await adminForAction()
    const { error } = await supabase
      .from('bookings')
      .update({
        admin_notes: clean(values.admin_notes, 5000) || null,
        arrival_details: clean(values.arrival_details, 1000) || null,
        special_requests: clean(values.special_requests, 2000) || null,
      })
      .eq('id', bookingId)
    if (error) return fail(error)
    refresh(bookingId)
    return { ok: true, message: 'Notes saved.' }
  } catch (e) {
    return fail(e)
  }
}

const PAYMENT_KINDS = ['advance', 'balance', 'refund', 'other']
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'card', 'other']

export async function recordPayment(
  bookingId: string,
  input: { kind: string; amount: string; method: string; verified: boolean; reference_note?: string; notes?: string },
): Promise<Result> {
  try {
    if (!UUID.test(bookingId)) return { ok: false, error: 'Unknown booking.' }
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { ok: false, error: 'Enter an amount greater than zero.' }
    if (!PAYMENT_KINDS.includes(input.kind) || !PAYMENT_METHODS.includes(input.method)) {
      return { ok: false, error: 'Choose a payment type and method.' }
    }
    const { supabase, userId } = await adminForAction()
    const { data: booking } = await supabase.from('bookings').select('currency').eq('id', bookingId).single()
    if (!booking) return { ok: false, error: 'Booking not found.' }

    const { error } = await supabase.from('payments').insert({
      booking_id: bookingId,
      kind: input.kind,
      amount: Math.round(amount * 100) / 100,
      currency: booking.currency,
      method: input.method,
      status: input.verified ? 'verified' : 'pending',
      verified_by: input.verified ? userId : null,
      verified_at: input.verified ? new Date().toISOString() : null,
      reference_note: clean(input.reference_note, 300) || null,
      notes: clean(input.notes, 1000) || null,
    })
    if (error) return fail(error)
    await supabase.rpc('refresh_booking_payment', { p_booking_id: bookingId })
    refresh(bookingId)
    return { ok: true, message: 'Payment recorded.' }
  } catch (e) {
    return fail(e)
  }
}

export async function setPaymentStatus(paymentId: string, status: 'verified' | 'rejected' | 'pending'): Promise<Result> {
  try {
    if (!UUID.test(paymentId) || !['verified', 'rejected', 'pending'].includes(status)) return { ok: false, error: 'Invalid request.' }
    const { supabase, userId } = await adminForAction()
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status,
        verified_by: status === 'verified' ? userId : null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      })
      .eq('id', paymentId)
      .select('booking_id')
      .single()
    if (error || !payment) return fail(error)
    await supabase.rpc('refresh_booking_payment', { p_booking_id: payment.booking_id })
    refresh(payment.booking_id)
    return { ok: true, message: status === 'verified' ? 'Payment verified.' : 'Payment updated.' }
  } catch (e) {
    return fail(e)
  }
}

const REQUEST_STATUSES = ['included', 'quote_pending', 'quoted', 'accepted', 'declined', 'fulfilled', 'cancelled']
const REQUEST_KINDS = ['package', 'custom_decoration', 'airport_transfer', 'early_check_in', 'late_check_out', 'extended_stay', 'other']

export async function updateRequest(
  requestId: string,
  input: { status: string; amount: string; counts_towards_total: boolean; admin_notes?: string },
): Promise<Result> {
  try {
    if (!UUID.test(requestId) || !REQUEST_STATUSES.includes(input.status)) return { ok: false, error: 'Invalid request.' }
    const amount = input.amount.trim() === '' ? null : Number(input.amount)
    if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) {
      return { ok: false, error: 'Enter a valid amount.' }
    }
    if (input.status === 'quoted' && amount === null) return { ok: false, error: 'Add a price before sending a quote.' }

    const { supabase } = await adminForAction()
    const { data: request, error } = await supabase
      .from('booking_requests')
      .update({
        status: input.status,
        amount,
        counts_towards_total: input.counts_towards_total && amount !== null,
        admin_notes: clean(input.admin_notes, 2000) || null,
        fulfilled_at: input.status === 'fulfilled' ? new Date().toISOString() : null,
      })
      .eq('id', requestId)
      .select('booking_id')
      .single()
    if (error || !request) return fail(error)
    await recalculateBookingTotals(request.booking_id, supabase)
    refresh(request.booking_id)
    return { ok: true, message: 'Request updated.' }
  } catch (e) {
    return fail(e)
  }
}

export async function addRequest(
  bookingId: string,
  input: { kind: string; title: string; details?: string; amount: string },
): Promise<Result> {
  try {
    if (!UUID.test(bookingId) || !REQUEST_KINDS.includes(input.kind)) return { ok: false, error: 'Invalid request.' }
    const title = clean(input.title, 160)
    if (!title) return { ok: false, error: 'Give the extra a title.' }
    const amount = input.amount.trim() === '' ? null : Number(input.amount)
    if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) {
      return { ok: false, error: 'Enter a valid amount.' }
    }
    const { supabase } = await adminForAction()
    const { error } = await supabase.from('booking_requests').insert({
      booking_id: bookingId,
      kind: input.kind,
      title,
      details: clean(input.details, 2000) || null,
      amount,
      status: amount === null ? 'quote_pending' : 'accepted',
      counts_towards_total: amount !== null,
    })
    if (error) return fail(error)
    await recalculateBookingTotals(bookingId, supabase)
    refresh(bookingId)
    return { ok: true, message: 'Extra added to the booking.' }
  } catch (e) {
    return fail(e)
  }
}

const SOURCES = ['walk_in', 'phone', 'whatsapp', 'admin', 'website']

export async function createAdminBooking(input: {
  roomTypeId: string
  roomId?: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  fullName: string
  email?: string
  phone?: string
  country?: string
  source: string
  confirm: boolean
  discountCode?: string
  specialRequests?: string
  adminNotes?: string
}): Promise<Result> {
  try {
    const { supabase } = await adminForAction()
    const fullName = clean(input.fullName, 120)
    if (fullName.length < 2) return { ok: false, error: 'Enter the guest’s name.' }
    const email = clean(input.email, 200).toLowerCase()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email or leave it empty.' }
    if (!SOURCES.includes(input.source)) return { ok: false, error: 'Choose a booking source.' }
    if (input.roomId && !UUID.test(input.roomId)) return { ok: false, error: 'Invalid room.' }

    const search = parseStaySearch({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: String(input.adults),
      children: String(input.children),
    })
    if ('error' in search) return { ok: false, error: search.error }

    const priced = await priceSelection({ roomTypeId: input.roomTypeId, search, discountCode: input.discountCode })
    if ('error' in priced) return { ok: false, error: priced.error }
    if (priced.site.demo) return { ok: false, error: 'Connect Supabase to create bookings.' }

    const site = await getSiteData()
    const { data, error } = await supabase.rpc('create_booking', {
      p_room_type_id: priced.roomType.id,
      p_check_in: search.checkIn,
      p_check_out: search.checkOut,
      p_adults: search.adults,
      p_children: search.children,
      p_customer: { full_name: fullName, email: email || null, phone: clean(input.phone, 40) || null, country: clean(input.country, 80) || null },
      p_totals: snapshotFor(priced),
      p_requests: [],
      p_discount_id: priced.discount?.id ?? null,
      p_source: input.source,
      p_room_id: input.roomId || null,
      p_status: input.confirm ? 'confirmed' : 'pending',
      p_hold_hours: site.settings.payment_deadline_hours,
      p_special_requests: clean(input.specialRequests, 2000) || null,
      p_arrival_details: null,
    })
    if (error) return fail(error)

    const row = (Array.isArray(data) ? data[0] : data) as { reference: string; booking_id?: string; id?: string }
    const { data: created } = await supabase.from('bookings').select('id').eq('reference', row.reference).single()
    if (created && clean(input.adminNotes, 5000)) {
      await supabase.from('bookings').update({ admin_notes: clean(input.adminNotes, 5000) }).eq('id', created.id)
    }
    if (created && input.confirm) {
      await supabase.from('bookings').update({ confirmed_at: new Date().toISOString(), hold_expires_at: null }).eq('id', created.id)
    }
    refresh()
    return { ok: true, message: `Booking ${row.reference} created.`, id: created?.id }
  } catch (e) {
    return fail(e)
  }
}

export async function addRoomBlock(input: { roomId: string; start: string; end: string; kind: string; note?: string }): Promise<Result> {
  try {
    if (!UUID.test(input.roomId) || !isISODate(input.start) || !isISODate(input.end)) return { ok: false, error: 'Choose a room and dates.' }
    if (input.end <= input.start) return { ok: false, error: 'The end date must be after the start date.' }
    if (!['maintenance', 'block'].includes(input.kind)) return { ok: false, error: 'Invalid block type.' }
    const { supabase } = await adminForAction()
    const { error } = await supabase.from('room_allocations').insert({
      room_id: input.roomId,
      kind: input.kind,
      stay: `[${input.start},${input.end})`,
      note: clean(input.note, 300) || null,
    })
    if (error) return fail(error)
    refresh()
    return { ok: true, message: 'Room blocked.' }
  } catch (e) {
    return fail(e)
  }
}

export async function removeRoomBlock(allocationId: string): Promise<Result> {
  try {
    if (!UUID.test(allocationId)) return { ok: false, error: 'Invalid block.' }
    const { supabase } = await adminForAction()
    const { error } = await supabase
      .from('room_allocations')
      .update({ active: false })
      .eq('id', allocationId)
      .neq('kind', 'booking')
    if (error) return fail(error)
    refresh()
    return { ok: true, message: 'Block removed.' }
  } catch (e) {
    return fail(e)
  }
}

export async function addTeamMember(email: string, role: string): Promise<Result> {
  try {
    const session = await adminForAction()
    if (session.role !== 'owner') return { ok: false, error: 'Only owners can manage the team.' }
    if (!['admin', 'staff', 'owner'].includes(role)) return { ok: false, error: 'Choose a role.' }
    const target = clean(email, 200).toLowerCase()
    const { hasServiceRole } = await import('@/lib/env')
    if (!hasServiceRole()) return { ok: false, error: 'Add SUPABASE_SERVICE_ROLE_KEY to manage the team.' }
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    let found: string | null = null
    for (let page = 1; page <= 20 && !found; page++) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
      if (error) return fail(error)
      found = data.users.find((u) => u.email?.toLowerCase() === target)?.id ?? null
      if (data.users.length < 200) break
    }
    if (!found) return { ok: false, error: 'No account with that email yet. Ask them to create one on the admin sign-in page first.' }
    const { error } = await service.from('admin_users').upsert({ user_id: found, role }, { onConflict: 'user_id' })
    if (error) return fail(error)
    refresh()
    return { ok: true, message: `${target} now has ${role} access.` }
  } catch (e) {
    return fail(e)
  }
}

export async function removeTeamMember(userId: string): Promise<Result> {
  try {
    const session = await adminForAction()
    if (session.role !== 'owner') return { ok: false, error: 'Only owners can manage the team.' }
    if (userId === session.userId) return { ok: false, error: 'You cannot remove your own access.' }
    const { error } = await session.supabase.from('admin_users').delete().eq('user_id', userId)
    if (error) return fail(error)
    refresh()
    return { ok: true, message: 'Access removed.' }
  } catch (e) {
    return fail(e)
  }
}
