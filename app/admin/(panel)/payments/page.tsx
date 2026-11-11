import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { PaymentQuickActions } from '@/components/admin/quick-actions'
import { StatusPill } from '@/components/admin/status-pill'
import { requireAdmin } from '@/lib/admin/auth'
import { PAYMENT_TONE } from '@/lib/admin/labels'
import { formatDateTime, formatMoney, humanize } from '@/lib/format'

export const metadata = { title: 'Payments' }

interface Row {
  id: string
  kind: string
  amount: number
  currency: string
  method: string
  status: string
  reference_note: string | null
  created_at: string
  bookings: { id: string; reference: string; customers: { full_name: string } | null } | null
}

export default async function PaymentsPage() {
  const { supabase } = await requireAdmin()
  const select = 'id, kind, amount, currency, method, status, reference_note, created_at, bookings(id, reference, customers(full_name))'
  const [pending, recent] = await Promise.all([
    supabase.from('payments').select(select).eq('status', 'pending').order('created_at'),
    supabase.from('payments').select(select).neq('status', 'pending').order('created_at', { ascending: false }).limit(40),
  ])

  const list = (rows: Row[], actions: boolean) =>
    rows.length === 0 ? (
      <p className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Nothing here.</p>
    ) : (
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-medium">
                {formatMoney(Number(p.amount), p.currency)} · {humanize(p.kind)} · {humanize(p.method)}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.bookings ? (
                  <Link href={`/admin/reservations/${p.bookings.id}`} className="font-mono hover:text-foreground">
                    {p.bookings.reference}
                  </Link>
                ) : null}{' '}
                · {p.bookings?.customers?.full_name ?? 'Guest'} · {formatDateTime(p.created_at)}
              </p>
              {p.reference_note ? <p className="text-xs">Transfer reference: {p.reference_note}</p> : null}
            </div>
            {actions ? <PaymentQuickActions paymentId={p.id} /> : <StatusPill value={p.status} tones={PAYMENT_TONE} />}
          </li>
        ))}
      </ul>
    )

  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="Bank transfers guests have reported. Check your bank statement, then verify — the booking confirms automatically once the advance is covered."
      />
      <section className="mb-8 flex flex-col gap-3" aria-labelledby="to-verify">
        <h2 id="to-verify" className="font-serif text-xl">
          To verify
        </h2>
        {list((pending.data ?? []) as unknown as Row[], true)}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="recent">
        <h2 id="recent" className="font-serif text-xl">
          Recent
        </h2>
        {list((recent.data ?? []) as unknown as Row[], false)}
      </section>
    </>
  )
}
