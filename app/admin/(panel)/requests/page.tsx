import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusPill } from '@/components/admin/status-pill'
import { requireAdmin } from '@/lib/admin/auth'
import { REQUEST_TONE } from '@/lib/admin/labels'
import { formatDate, formatMoney, humanize } from '@/lib/format'

export const metadata = { title: 'Extras & quotes' }

interface Row {
  id: string
  kind: string
  title: string
  details: string | null
  status: string
  amount: number
  bookings: { id: string; reference: string; check_in: string; currency: string; customers: { full_name: string } | null } | null
}

export default async function RequestsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('booking_requests')
    .select('id, kind, title, details, status, amount, bookings(id, reference, check_in, currency, customers(full_name))')
    .in('status', ['quote_pending', 'quoted', 'accepted', 'included'])
    .order('created_at', { ascending: false })
    .limit(200)
  const rows = (data ?? []) as unknown as Row[]

  const groups = [
    { title: 'Needs a quote', items: rows.filter((r) => r.status === 'quote_pending') },
    { title: 'Waiting for guest', items: rows.filter((r) => r.status === 'quoted') },
    { title: 'To prepare', items: rows.filter((r) => r.status === 'accepted' || r.status === 'included') },
  ]

  return (
    <>
      <AdminPageHeader
        title="Extras & quotes"
        description="Decorations, transfers and other add-ons. Open a booking to set a price, send a quote, or mark it fulfilled."
      />
      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3" aria-label={g.title}>
            <h2 className="font-serif text-xl">
              {g.title} <span className="text-base text-muted-foreground">({g.items.length})</span>
            </h2>
            {g.items.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">Nothing here.</p>
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border bg-card">
                {g.items.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.bookings ? `/admin/reservations/${r.bookings.id}` : '#'}
                      className="flex flex-col gap-1 p-4 text-sm hover:bg-muted/60 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {humanize(r.kind)} · {r.bookings?.customers?.full_name ?? 'Guest'} · arrives {formatDate(r.bookings?.check_in)}
                        </p>
                        {r.details ? <p className="line-clamp-2 text-xs text-muted-foreground">{r.details}</p> : null}
                      </div>
                      {Number(r.amount) > 0 ? <span>{formatMoney(Number(r.amount), r.bookings?.currency ?? 'USD')}</span> : null}
                      <StatusPill value={r.status} tones={REQUEST_TONE} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
