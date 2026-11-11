import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { BOOKING_LIST_SELECT, BookingTable, type BookingListRow } from '@/components/admin/booking-table'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDate, todayMaldives } from '@/lib/format'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const { supabase } = await requireAdmin()
  const today = todayMaldives()
  const live = ['pending', 'confirmed', 'checked_in']

  const [arrivals, departures, inHouse, pending, rooms, occupied] = await Promise.all([
    supabase.from('bookings').select(BOOKING_LIST_SELECT).eq('check_in', today).in('reservation_status', ['pending', 'confirmed']),
    supabase.from('bookings').select(BOOKING_LIST_SELECT).eq('check_out', today).eq('reservation_status', 'checked_in'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('reservation_status', 'checked_in'),
    supabase
      .from('bookings')
      .select(BOOKING_LIST_SELECT)
      .eq('reservation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .lte('check_in', today)
      .gt('check_out', today)
      .in('reservation_status', live),
  ])

  const totalRooms = rooms.count ?? 0
  const tonight = occupied.count ?? 0

  const stats = [
    { label: 'Arriving today', value: arrivals.data?.length ?? 0 },
    { label: 'Departing today', value: departures.data?.length ?? 0 },
    { label: 'Guests in house', value: inHouse.count ?? 0 },
    { label: 'Rooms occupied tonight', value: `${tonight} / ${totalRooms}` },
  ]

  return (
    <>
      <AdminPageHeader
        title="Today at Kai Lodge"
        description={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <Button render={<Link href="/admin/reservations/new" />} nativeButton={false}>
            <Plus aria-hidden="true" />
            New booking
          </Button>
        }
      />

      <dl className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-lg border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="font-serif text-3xl">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="flex flex-col gap-3" aria-labelledby="arrivals">
          <h2 id="arrivals" className="font-serif text-xl">
            Arrivals
          </h2>
          <BookingTable rows={(arrivals.data ?? []) as unknown as BookingListRow[]} empty="No arrivals today." />
        </section>
        <section className="flex flex-col gap-3" aria-labelledby="departures">
          <h2 id="departures" className="font-serif text-xl">
            Departures
          </h2>
          <BookingTable rows={(departures.data ?? []) as unknown as BookingListRow[]} empty="No departures today." />
        </section>
      </div>

      <section className="mt-8 flex flex-col gap-3" aria-labelledby="pending">
        <div className="flex items-center justify-between">
          <h2 id="pending" className="font-serif text-xl">
            Awaiting confirmation
          </h2>
          <Link href="/admin/reservations?status=pending" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <BookingTable rows={(pending.data ?? []) as unknown as BookingListRow[]} empty="Nothing waiting — all caught up." />
      </section>
    </>
  )
}
