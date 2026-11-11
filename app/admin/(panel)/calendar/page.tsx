import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { RemoveBlockButton } from '@/components/admin/quick-actions'
import { RoomBlockForm } from '@/components/admin/room-block-form'
import { requireAdmin } from '@/lib/admin/auth'
import { addDays, formatDate, isISODate, todayMaldives } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Room calendar' }

const DAYS = 14

interface Allocation {
  id: string
  room_id: string
  kind: string
  stay: string
  note: string | null
  bookings: { id: string; reference: string; reservation_status: string; customers: { full_name: string } | null } | null
}

function parseStay(stay: string) {
  const [start, end] = stay.replace(/[[\]()]/g, '').split(',')
  return { start: start.trim(), end: end.trim() }
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { supabase } = await requireAdmin()
  const params = await searchParams
  const from = params.from && isISODate(params.from) ? params.from : todayMaldives()
  const to = addDays(from, DAYS)
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i))

  const [{ data: rooms }, { data: allocs }] = await Promise.all([
    supabase.from('rooms').select('id, name, room_types(name)').eq('active', true).order('name'),
    supabase
      .from('room_allocations')
      .select('id, room_id, kind, stay, note, bookings(id, reference, reservation_status, customers(full_name))')
      .eq('active', true)
      .overlaps('stay', `[${from},${to})`),
  ])

  const allocations = ((allocs ?? []) as unknown as Allocation[]).map((a) => ({ ...a, ...parseStay(a.stay) }))
  const roomList = (rooms ?? []) as unknown as { id: string; name: string; room_types: { name: string } | null }[]
  const blocks = allocations.filter((a) => a.kind !== 'booking')

  return (
    <>
      <AdminPageHeader
        title="Room calendar"
        description={`${formatDate(from)} – ${formatDate(addDays(to, -1))}`}
        actions={
          <div className="flex gap-2 text-sm">
            <Link href={`/admin/calendar?from=${addDays(from, -DAYS)}`} className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
              ← Earlier
            </Link>
            <Link href="/admin/calendar" className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
              Today
            </Link>
            <Link href={`/admin/calendar?from=${to}`} className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
              Later →
            </Link>
          </div>
        }
      />

      <div className="mb-6 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <caption className="sr-only">Room occupancy by night</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-40 bg-card p-2 text-left font-medium">
                Room
              </th>
              {days.map((d) => (
                <th key={d} scope="col" className={cn('p-1 text-center font-normal text-muted-foreground', d === todayMaldives() && 'text-foreground')}>
                  <span className="block">{formatDate(d, { weekday: 'short' })}</span>
                  <span className="block font-medium">{formatDate(d, { day: 'numeric', month: 'short' })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomList.map((room) => (
              <tr key={room.id} className="border-t">
                <th scope="row" className="sticky left-0 z-10 bg-card p-2 text-left font-normal">
                  <span className="block font-medium">{room.name}</span>
                  <span className="block text-muted-foreground">{room.room_types?.name}</span>
                </th>
                {days.map((d) => {
                  const a = allocations.find((x) => x.room_id === room.id && x.start <= d && x.end > d)
                  if (!a) return <td key={d} className="border-l p-0.5" aria-label="Available" />
                  const isStart = a.start === d || d === from
                  const label = a.kind === 'booking' ? (a.bookings?.customers?.full_name ?? 'Booked') : a.kind === 'maintenance' ? 'Maintenance' : 'Blocked'
                  const cellClass = cn(
                    'block h-9 truncate rounded px-1.5 py-1 text-left',
                    a.kind !== 'booking'
                      ? 'bg-muted text-muted-foreground'
                      : a.bookings?.reservation_status === 'pending'
                        ? 'bg-gold/30 text-foreground'
                        : 'bg-ink text-ink-foreground',
                  )
                  return (
                    <td key={d} className="border-l p-0.5">
                      {a.kind === 'booking' && a.bookings ? (
                        <Link href={`/admin/reservations/${a.bookings.id}`} className={cellClass} title={`${label} · ${a.bookings.reference}`}>
                          {isStart ? label : <span className="sr-only">{label}</span>}
                        </Link>
                      ) : (
                        <span className={cellClass} title={a.note ?? label}>
                          {isStart ? label : <span className="sr-only">{label}</span>}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-ink" aria-hidden="true" /> Confirmed / in house
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-gold/30" aria-hidden="true" /> Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-muted" aria-hidden="true" /> Blocked
        </span>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="blocks">
        <h2 id="blocks" className="font-serif text-xl">
          Block a room
        </h2>
        <RoomBlockForm rooms={roomList.map((r) => ({ id: r.id, name: r.name }))} />
        {blocks.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 p-3">
                <span className="flex-1">
                  {roomList.find((r) => r.id === b.room_id)?.name} · {formatDate(b.start)} → {formatDate(b.end)}
                  {b.note ? <span className="text-muted-foreground"> · {b.note}</span> : null}
                </span>
                <RemoveBlockButton allocationId={b.id} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  )
}
