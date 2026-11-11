import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { RecordManager } from '@/components/admin/record-manager'
import { requireAdmin } from '@/lib/admin/auth'
import { RESOURCES, type FieldDef } from '@/lib/admin/resources'

export const metadata = { title: 'Customers' }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireAdmin()
  const q = ((await searchParams).q ?? '').trim().slice(0, 80)

  let query = supabase.from('customers').select('*, bookings(id, reference)').order('created_at', { ascending: false }).limit(200)
  if (q) {
    const safe = q.replace(/[%_,()*\\]/g, ' ')
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }
  const { data } = await query
  const rows = (data ?? []).map((c) => ({ ...c, stays: (c.bookings as unknown[] | null)?.length ?? 0 }))

  return (
    <>
      <AdminPageHeader title="Customers" description="Every guest who has booked or been booked by the team." />
      <form className="mb-4 flex gap-2" action="/admin/customers">
        <label htmlFor="cq" className="sr-only">
          Search customers
        </label>
        <Input id="cq" name="q" defaultValue={q} placeholder="Name, phone or email" className="max-w-sm bg-card" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <RecordManager
        resource="customers"
        singular="customer"
        fields={RESOURCES.customers.fields as FieldDef[]}
        rows={rows as (Record<string, unknown> & { id: string })[]}
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'stays', label: 'Bookings' },
        ]}
        canDelete={false}
        extra={(row) => {
          const bookings = (row.bookings as { id: string; reference: string }[] | null) ?? []
          if (!bookings.length) return null
          return (
            <p className="flex flex-wrap gap-2 text-xs">
              {bookings.slice(0, 6).map((b) => (
                <Link key={b.id} href={`/admin/reservations/${b.id}`} className="font-mono text-muted-foreground hover:text-foreground">
                  {b.reference}
                </Link>
              ))}
            </p>
          )
        }}
      />
    </>
  )
}
