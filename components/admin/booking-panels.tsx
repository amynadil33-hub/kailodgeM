'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  addRequest,
  amendDates,
  reassignRoom,
  recordPayment,
  saveBookingNotes,
  setPaymentStatus,
  setReservationStatus,
  updateRequest,
} from '@/app/actions/admin-bookings'
import { FormMessage, selectClass } from './form-bits'
import { StatusPill } from './status-pill'
import { PAYMENT_TONE, REQUEST_TONE, RESERVATION_ACTIONS } from '@/lib/admin/labels'
import { formatDateTime, formatMoney, humanize } from '@/lib/format'
import { cn } from '@/lib/utils'

type Result = { ok: boolean; message?: string; error?: string } | null

function useAction() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<Result>(null)
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, onOk?: () => void) =>
    start(async () => {
      const res = await fn()
      setResult(res)
      if (res.ok) {
        onOk?.()
        router.refresh()
      }
    })
  return { pending, result, run }
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-lg border bg-card p-5', className)} aria-label={title}>
      <h2 className="font-serif text-lg">{title}</h2>
      {children}
    </section>
  )
}

export function StatusActions({ bookingId, status }: { bookingId: string; status: string }) {
  const { pending, result, run } = useAction()
  const actions = RESERVATION_ACTIONS[status] ?? []
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.to}
            variant={a.danger ? 'outline' : 'default'}
            className={a.danger ? 'text-destructive' : undefined}
            disabled={pending}
            onClick={() => {
              if (a.danger && !confirm(`${a.label}? The guest's room will be released.`)) return
              run(() => setReservationStatus(bookingId, a.to))
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <FormMessage result={result} />
    </div>
  )
}

export function RoomAssign({
  bookingId,
  currentRoomId,
  rooms,
}: {
  bookingId: string
  currentRoomId: string | null
  rooms: { id: string; name: string }[]
}) {
  const { pending, result, run } = useAction()
  const [roomId, setRoomId] = useState(currentRoomId ?? '')
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (roomId) run(() => reassignRoom(bookingId, roomId))
      }}
    >
      <Label htmlFor="room-assign">Assigned room</Label>
      <div className="flex gap-2">
        <select id="room-assign" value={roomId} onChange={(e) => setRoomId(e.target.value)} className={selectClass}>
          {!currentRoomId ? <option value="">Not assigned</option> : null}
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" disabled={pending || !roomId || roomId === currentRoomId}>
          Move
        </Button>
      </div>
      <FormMessage result={result} />
    </form>
  )
}

export function DatesForm({ bookingId, checkIn, checkOut }: { bookingId: string; checkIn: string; checkOut: string }) {
  const { pending, result, run } = useAction()
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        run(() => amendDates(bookingId, String(f.get('check_in')), String(f.get('check_out'))))
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amend-in">Check-in</Label>
          <Input id="amend-in" name="check_in" type="date" defaultValue={checkIn} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amend-out">Check-out</Label>
          <Input id="amend-out" name="check_out" type="date" defaultValue={checkOut} required />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Use this for extended stays or date changes. Availability is checked and the room charge is re-priced with the rates
        locked in at booking.
      </p>
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        Update dates
      </Button>
      <FormMessage result={result} />
    </form>
  )
}

export function NotesForm({
  bookingId,
  values,
}: {
  bookingId: string
  values: { admin_notes: string; arrival_details: string; special_requests: string }
}) {
  const { pending, result, run } = useAction()
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        run(() =>
          saveBookingNotes(bookingId, {
            admin_notes: String(f.get('admin_notes') ?? ''),
            arrival_details: String(f.get('arrival_details') ?? ''),
            special_requests: String(f.get('special_requests') ?? ''),
          }),
        )
      }}
    >
      {(
        [
          ['special_requests', 'Guest requests'],
          ['arrival_details', 'Arrival details (flight, ferry, time)'],
          ['admin_notes', 'Internal notes — never shown to the guest'],
        ] as const
      ).map(([name, label]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <Label htmlFor={`note-${name}`}>{label}</Label>
          <Textarea id={`note-${name}`} name={name} defaultValue={values[name]} rows={3} />
        </div>
      ))}
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        Save notes
      </Button>
      <FormMessage result={result} />
    </form>
  )
}

export interface PaymentRow {
  id: string
  kind: string
  amount: number
  currency: string
  method: string
  status: string
  reference_note: string | null
  notes: string | null
  created_at: string
}

export function PaymentsPanel({ bookingId, payments, currency }: { bookingId: string; payments: PaymentRow[]; currency: string }) {
  const { pending, result, run } = useAction()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : null}
      <ul className="flex flex-col divide-y">
        {payments.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-medium">
                {formatMoney(Number(p.amount), p.currency)} · {humanize(p.kind)} · {humanize(p.method)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(p.created_at)}
                {p.reference_note ? ` · Ref: ${p.reference_note}` : ''}
              </p>
              {p.notes ? <p className="text-xs text-muted-foreground">{p.notes}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <StatusPill value={p.status} tones={PAYMENT_TONE} />
              {p.status === 'pending' ? (
                <>
                  <Button size="sm" disabled={pending} onClick={() => run(() => setPaymentStatus(p.id, 'verified'))}>
                    <Check aria-hidden="true" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() => run(() => setPaymentStatus(p.id, 'rejected'))}
                  >
                    <X aria-hidden="true" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setPaymentStatus(p.id, 'pending'))}>
                  Reopen
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            run(
              () =>
                recordPayment(bookingId, {
                  kind: String(f.get('kind')),
                  amount: String(f.get('amount')),
                  method: String(f.get('method')),
                  verified: f.get('verified') === 'on',
                  reference_note: String(f.get('reference_note') ?? ''),
                  notes: String(f.get('notes') ?? ''),
                }),
              () => setAdding(false),
            )
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Amount ({currency})</Label>
            <Input id="pay-amount" name="amount" type="number" min="0.01" step="0.01" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-kind">Type</Label>
            <select id="pay-kind" name="kind" className={selectClass} defaultValue="advance">
              {['advance', 'balance', 'refund', 'other'].map((k) => (
                <option key={k} value={k}>
                  {humanize(k)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-method">Method</Label>
            <select id="pay-method" name="method" className={selectClass} defaultValue="bank_transfer">
              {['bank_transfer', 'cash', 'card', 'other'].map((k) => (
                <option key={k} value={k}>
                  {humanize(k)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-ref">Reference</Label>
            <Input id="pay-ref" name="reference_note" placeholder="Transfer ref or receipt no." />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="pay-notes">Notes</Label>
            <Input id="pay-notes" name="notes" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="verified" defaultChecked className="size-4 accent-[var(--gold)]" />
            Payment received and verified
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              Record payment
            </Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setAdding(true)}>
          Record a payment
        </Button>
      )}
      <FormMessage result={result} />
    </div>
  )
}

export interface RequestRow {
  id: string
  kind: string
  title: string
  details: string | null
  status: string
  amount: number
  counts_towards_total: boolean
  admin_notes: string | null
}

const REQUEST_STATUSES = ['included', 'quote_pending', 'quoted', 'accepted', 'declined', 'fulfilled', 'cancelled']
const REQUEST_KINDS = ['package', 'custom_decoration', 'airport_transfer', 'early_check_in', 'late_check_out', 'extended_stay', 'other']

export function RequestEditor({ request, currency }: { request: RequestRow; currency: string }) {
  const { pending, result, run } = useAction()
  return (
    <form
      className="flex flex-col gap-3 py-3"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        run(() =>
          updateRequest(request.id, {
            status: String(f.get('status')),
            amount: String(f.get('amount')),
            counts_towards_total: f.get('counts') === 'on',
            admin_notes: String(f.get('admin_notes') ?? ''),
          }),
        )
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm font-medium">{request.title}</p>
        <StatusPill value={request.status} tones={REQUEST_TONE} />
      </div>
      {request.details ? <p className="text-sm leading-relaxed text-muted-foreground">{request.details}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`rq-status-${request.id}`}>Status</Label>
          <select id={`rq-status-${request.id}`} name="status" defaultValue={request.status} className={selectClass}>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`rq-amount-${request.id}`}>Price ({currency})</Label>
          <Input id={`rq-amount-${request.id}`} name="amount" type="number" min="0" step="0.01" defaultValue={request.amount} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="counts" defaultChecked={request.counts_towards_total} className="size-4 accent-[var(--gold)]" />
          Add to booking total
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`rq-notes-${request.id}`}>Note to guest / internal note</Label>
        <Input id={`rq-notes-${request.id}`} name="admin_notes" defaultValue={request.admin_notes ?? ''} />
      </div>
      <p className="text-xs text-muted-foreground">
        To send a quote: set the price, choose “Quoted”, and the guest can accept or decline from their booking page.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Save
        </Button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}

export function AddRequestForm({ bookingId, currency }: { bookingId: string; currency: string }) {
  const { pending, result, run } = useAction()
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
          Add an extra
        </Button>
        <FormMessage result={result} />
      </div>
    )
  return (
    <form
      className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        run(
          () =>
            addRequest(bookingId, {
              kind: String(f.get('kind')),
              title: String(f.get('title')),
              details: String(f.get('details') ?? ''),
              amount: String(f.get('amount') ?? '0'),
            }),
          () => setOpen(false),
        )
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-rq-kind">Type</Label>
        <select id="new-rq-kind" name="kind" defaultValue="other" className={selectClass}>
          {REQUEST_KINDS.map((k) => (
            <option key={k} value={k}>
              {humanize(k)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-rq-amount">Price ({currency})</Label>
        <Input id="new-rq-amount" name="amount" type="number" min="0" step="0.01" defaultValue="0" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="new-rq-title">Title</Label>
        <Input id="new-rq-title" name="title" required placeholder="e.g. Airport pickup at 22:40" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="new-rq-details">Details</Label>
        <Textarea id="new-rq-details" name="details" rows={2} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Add
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <div className="sm:col-span-2">
        <FormMessage result={result} />
      </div>
    </form>
  )
}
