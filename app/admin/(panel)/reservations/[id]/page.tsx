import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusPill } from '@/components/admin/status-pill'
import {
  AddRequestForm,
  DatesForm,
  NotesForm,
  Panel,
  PaymentsPanel,
  RequestEditor,
  RoomAssign,
  StatusActions,
  type PaymentRow,
  type RequestRow,
} from '@/components/admin/booking-panels'
import { requireAdmin } from '@/lib/admin/auth'
import { PAYMENT_TONE, RESERVATION_TONE } from '@/lib/admin/labels'
import { formatDate, formatDateTime, formatMoney, humanize, nightsBetween } from '@/lib/format'

export const metadata = { title: 'Reservation' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const { supabase } = await requireAdmin()

  const { data: b } = await supabase
    .from('bookings')
    .select(
      '*, customers(id, full_name, email, phone, country), room_types(id, name), payments(*), booking_requests(*), room_allocations(id, room_id, active, kind, rooms(name))',
    )
    .eq('id', id)
    .maybeSingle()
  if (!b) notFound()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('room_type_id', b.room_type_id)
    .eq('active', true)
    .order('name')

  const allocation = (b.room_allocations as { room_id: string; active: boolean; kind: string; rooms: { name: string } | null }[]).find(
    (a) => a.active && a.kind === 'booking',
  )
  const payments = ((b.payments ?? []) as PaymentRow[]).sort((x, y) => y.created_at.localeCompare(x.created_at))
  const requests = (b.booking_requests ?? []) as RequestRow[]
  const paid = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + (p.kind === 'refund' ? -1 : 1) * Number(p.amount), 0)
  const balance = Number(b.grand_total) - paid
  const customer = b.customers as { id: string; full_name: string; email: string | null; phone: string | null; country: string | null } | null
  const phoneDigits = customer?.phone?.replace(/\D/g, '')
  const nights = nightsBetween(b.check_in, b.check_out)
  const money = (n: number) => formatMoney(n, b.currency)

  return (
    <>
      <Link href="/admin/reservations" className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← All reservations
      </Link>
      <AdminPageHeader
        title={customer?.full_name ?? 'Guest'}
        description={`${b.reference} · ${(b.room_types as { name: string } | null)?.name ?? ''} · ${humanize(b.source)} booking · created ${formatDateTime(b.created_at)}`}
        actions={
          <>
            {phoneDigits ? (
              <Button variant="outline" render={<a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                <MessageCircle aria-hidden="true" />
                WhatsApp guest
              </Button>
            ) : null}
            <Button variant="outline" render={<a href={`/booking/${b.access_token}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
              <ExternalLink aria-hidden="true" />
              Guest booking page
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusPill value={b.reservation_status} tones={RESERVATION_TONE} />
        <StatusPill value={b.payment_status} tones={PAYMENT_TONE} />
        {b.reservation_status === 'pending' && b.hold_expires_at ? (
          <span className="text-xs text-muted-foreground">Hold expires {formatDateTime(b.hold_expires_at)}</span>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Stay">
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Check-in</dt>
                <dd className="font-medium">{formatDate(b.check_in)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Check-out</dt>
                <dd className="font-medium">{formatDate(b.check_out)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Nights</dt>
                <dd className="font-medium">{nights}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Guests</dt>
                <dd className="font-medium">
                  {b.adults} adult{b.adults === 1 ? '' : 's'}
                  {b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}
                </dd>
              </div>
            </dl>
            <StatusActions bookingId={b.id} status={b.reservation_status} />
          </Panel>

          <Panel title="Payments">
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="font-serif text-xl">{money(Number(b.grand_total))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Advance due ({b.advance_percent}%)</dt>
                <dd className="font-serif text-xl">{money(Number(b.advance_amount))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Received</dt>
                <dd className="font-serif text-xl">{money(paid)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Balance</dt>
                <dd className="font-serif text-xl">{money(balance)}</dd>
              </div>
            </dl>
            <PaymentsPanel bookingId={b.id} payments={payments} currency={b.currency} />
          </Panel>

          <Panel title="Extras, decorations & quotes">
            {requests.length === 0 ? <p className="text-sm text-muted-foreground">No extras requested.</p> : null}
            <div className="flex flex-col divide-y">
              {requests.map((r) => (
                <RequestEditor key={r.id} request={r} currency={b.currency} />
              ))}
            </div>
            <AddRequestForm bookingId={b.id} currency={b.currency} />
          </Panel>

          <Panel title="Notes">
            <NotesForm
              bookingId={b.id}
              values={{
                admin_notes: b.admin_notes ?? '',
                arrival_details: b.arrival_details ?? '',
                special_requests: b.special_requests ?? '',
              }}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Guest">
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd>{customer?.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd>{customer?.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all">{customer?.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Country</dt>
                <dd>{customer?.country || '—'}</dd>
              </div>
            </dl>
            {customer ? (
              <Link href={`/admin/customers?q=${encodeURIComponent(customer.full_name)}`} className="text-sm text-muted-foreground hover:text-foreground">
                View guest history →
              </Link>
            ) : null}
          </Panel>

          <Panel title="Room & dates">
            <RoomAssign bookingId={b.id} currentRoomId={allocation?.room_id ?? null} rooms={rooms ?? []} />
            <DatesForm bookingId={b.id} checkIn={b.check_in} checkOut={b.check_out} />
          </Panel>

          <Panel title="Price breakdown">
            <dl className="flex flex-col gap-1.5 text-sm">
              {[
                ['Room', b.room_subtotal],
                ['Discounts', -Number(b.discount_total)],
                ['Extras', b.extras_total],
                ['Fees & taxes', b.fees_total],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{money(Number(value))}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t pt-2 font-medium">
                <dt>Total</dt>
                <dd>{money(Number(b.grand_total))}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  )
}
