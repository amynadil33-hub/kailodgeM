import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Kai Lodge Admin' },
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, email } = await requireAdmin()

  const [pending, payments, requests, enquiries] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('reservation_status', 'pending'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('booking_requests').select('id', { count: 'exact', head: true }).eq('status', 'quote_pending'),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  return (
    <div className="flex min-h-svh flex-col bg-muted/40 lg:flex-row">
      <AdminNav
        email={email}
        badges={{
          '/admin/reservations': pending.count ?? 0,
          '/admin/payments': payments.count ?? 0,
          '/admin/requests': requests.count ?? 0,
          '/admin/enquiries': enquiries.count ?? 0,
        }}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
