import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { BOOKING_LIST_SELECT, BookingTable, type BookingListRow } from '@/components/admin/booking-table'
import { requireAdmin } from '@/lib/admin/auth'
import { humanize, isISODate } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Reservations' }

const STATUSES = ['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired', 'no_show']
const PAGE_SIZE = 50

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; page?: string }>
}) {
  const { supabase } = await requireAdmin()
  const params = await searchParams
  const status = STATUSES.includes(params.status ?? '') ? params.status! : 'all'
  const q = (params.q ?? '').trim().slice(0, 80)
  const page = Math.max(1, Math.min(200, Number(params.page) || 1))

  let query = supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT, { count: 'exact' })
    .order('check_in', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (status !== 'all') query = query.eq('reservation_status', status)
  if (params.from && isISODate(params.from)) query = query.gte('check_in', params.from)

  if (q) {
    const safe = q.replace(/[%_,()*\\]/g, ' ')
    const { data: matches } = await supabase
      .from('customers')
      .select('id')
      .or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
      .limit(200)
    const ids = (matches ?? []).map((m) => m.id)
    query = /^KL-/i.test(q)
      ? query.ilike('reference', `${safe.toUpperCase()}%`)
      : query.in('customer_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, count } = await query
  const total = count ?? 0
  const href = (next: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { status, q, from: params.from, page, ...next }
    for (const [k, v] of Object.entries(merged)) if (v && v !== 'all' && !(k === 'page' && v === 1)) sp.set(k, String(v))
    return `/admin/reservations${sp.size ? `?${sp}` : ''}`
  }

  return (
    <>
      <AdminPageHeader
        title="Reservations"
        description={`${total} reservation${total === 1 ? '' : 's'}`}
        actions={
          <Button render={<Link href="/admin/reservations/new" />} nativeButton={false}>
            <Plus aria-hidden="true" />
            New booking
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s, page: 1 })}
              aria-current={status === s ? 'page' : undefined}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                status === s ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted',
              )}
            >
              {s === 'all' ? 'All' : humanize(s)}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap gap-2" action="/admin/reservations">
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="q" className="sr-only">
            Search reservations
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="Guest name, phone, email or KL- reference" className="max-w-sm bg-card" />
          <label htmlFor="from" className="sr-only">
            Arriving from
          </label>
          <Input id="from" name="from" type="date" defaultValue={params.from} className="w-auto bg-card" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <BookingTable rows={(data ?? []) as unknown as BookingListRow[]} empty="No reservations match." />

      {total > PAGE_SIZE ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })}>← Previous</Link> : <span />}
          <span className="text-muted-foreground">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          {page * PAGE_SIZE < total ? <Link href={href({ page: page + 1 })}>Next →</Link> : <span />}
        </nav>
      ) : null}
    </>
  )
}
