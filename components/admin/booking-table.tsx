import Link from 'next/link'
import { StatusPill } from './status-pill'
import { PAYMENT_TONE, RESERVATION_TONE } from '@/lib/admin/labels'
import { formatDate, formatMoney, humanize } from '@/lib/format'

export interface BookingListRow {
  id: string
  reference: string
  check_in: string
  check_out: string
  adults: number
  children: number
  source: string
  reservation_status: string
  payment_status: string
  grand_total: number
  currency: string
  customers: { full_name: string; phone: string | null } | null
  room_types: { name: string } | null
}

export const BOOKING_LIST_SELECT =
  'id, reference, check_in, check_out, adults, children, source, reservation_status, payment_status, grand_total, currency, customers(full_name, phone), room_types(name)'

export function BookingTable({ rows, empty = 'No reservations.' }: { rows: BookingListRow[]; empty?: string }) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
      {rows.map((b) => (
        <li key={b.id}>
          <Link
            href={`/admin/reservations/${b.id}`}
            className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm transition-colors hover:bg-muted/60 md:grid-cols-[1.4fr_1.2fr_1fr_auto_auto] md:items-center"
          >
            <div className="col-span-2 min-w-0 md:col-span-1">
              <p className="truncate font-medium">{b.customers?.full_name ?? 'Guest'}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {b.reference} · {humanize(b.source)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate">{b.room_types?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                {b.adults} adult{b.adults === 1 ? '' : 's'}
                {b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}
              </p>
            </div>
            <div>
              <p>
                {formatDate(b.check_in, { day: 'numeric', month: 'short' })} → {formatDate(b.check_out, { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-xs text-muted-foreground">{formatMoney(Number(b.grand_total), b.currency)}</p>
            </div>
            <StatusPill value={b.reservation_status} tones={RESERVATION_TONE} />
            <StatusPill value={b.payment_status} tones={PAYMENT_TONE} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
