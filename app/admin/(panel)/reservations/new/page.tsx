import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { NewBookingForm } from '@/components/admin/new-booking-form'
import { requireAdmin } from '@/lib/admin/auth'
import { todayMaldives } from '@/lib/format'

export const metadata = { title: 'New booking' }

export default async function NewBookingPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('room_types').select('id, name, rooms(id, name, active)').eq('active', true).order('sort')
  const roomTypes = (data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    rooms: ((t.rooms ?? []) as { id: string; name: string; active: boolean }[]).filter((r) => r.active),
  }))

  return (
    <>
      <Link href="/admin/reservations" className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← All reservations
      </Link>
      <AdminPageHeader
        title="New booking"
        description="For WhatsApp, phone and walk-in guests. Prices follow your current rates, offers and fees."
      />
      <NewBookingForm roomTypes={roomTypes} today={todayMaldives()} />
    </>
  )
}
