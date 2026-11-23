import { notFound } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { RecordManager, type Column } from '@/components/admin/record-manager'
import { AmenityAssigner } from '@/components/admin/amenity-assigner'
import { RoomCatalogueBootstrap } from '@/components/admin/room-catalogue-bootstrap'
import { requireAdmin } from '@/lib/admin/auth'
import { isResourceKey, RESOURCES, type FieldDef } from '@/lib/admin/resources'
import { hasServiceRole } from '@/lib/env'

const TITLES: Record<string, { title: string; description: string }> = {
  room_types: { title: 'Room types', description: 'What guests see and book: names, descriptions, base rates and capacity.' },
  rooms: { title: 'Rooms', description: 'The physical rooms behind each room type. Bookings are assigned to these.' },
  rate_periods: { title: 'Seasonal rates', description: 'Override the base rate for peak season, holidays or quiet periods.' },
  amenities: { title: 'Amenities', description: 'Shown on the amenities page and on each room.' },
  packages: { title: 'Decoration packages', description: 'Birthday, anniversary and celebration set-ups guests can add.' },
  discounts: { title: 'Offers', description: 'Promo codes and automatic discounts such as long-stay offers.' },
  fees: { title: 'Fees & taxes', description: 'Applied to every booking at checkout, e.g. T-GST or green tax.' },
  bank_accounts: { title: 'Bank accounts', description: 'Shown to guests when they pay their advance by transfer.' },
  places: { title: 'Neighbourhood', description: 'Nearby places featured on the website.' },
  media: { title: 'Photographs', description: 'Website and room gallery images.' },
}

function columnsFor(fields: FieldDef[]): Column[] {
  const cols: Column[] = []
  for (const f of fields) {
    if (cols.length >= 4) break
    if (f.type === 'textarea' || f.type === 'code' || f.ref) continue
    cols.push({
      key: f.name,
      label: f.label,
      format: f.type === 'boolean' ? 'bool' : f.type === 'date' ? 'date' : f.type === 'image' ? 'image' : /rate|price|amount/.test(f.name) ? 'money' : undefined,
    })
  }
  return cols
}

export default async function ManagePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params
  if (!isResourceKey(resource) || resource === 'customers') notFound()
  const session = await requireAdmin()
  const { supabase } = session
  const def = RESOURCES[resource]
  const fields = def.fields as FieldDef[]

  let query = supabase.from(def.table).select('*').limit(500)
  for (const o of def.order) query = query.order(o.column, { ascending: o.ascending })

  const needsRoomTypes = fields.some((f) => f.ref === 'room_types') || resource === 'room_types'
  const [rowsResult, roomTypes, settings, amenities, links] = await Promise.all([
    query,
    needsRoomTypes ? supabase.from('room_types').select('id, name').order('sort') : Promise.resolve({ data: [] }),
    supabase.from('site_settings').select('base_currency').eq('id', 1).maybeSingle(),
    resource === 'room_types' ? supabase.from('amenities').select('id, name').order('name') : Promise.resolve({ data: [] }),
    resource === 'room_types' ? supabase.from('room_type_amenities').select('room_type_id, amenity_id') : Promise.resolve({ data: [] }),
  ])

  const rows = rowsResult.data ?? []
  const loadError = Boolean(rowsResult.error || ('error' in roomTypes && roomTypes.error))
  const refOptions = ((roomTypes.data ?? []) as { id: string; name: string }[]).map((r) => ({ value: r.id, label: r.name }))
  const allAmenities = (amenities.data ?? []) as { id: string; name: string }[]
  const linkRows = (links.data ?? []) as { room_type_id: string; amenity_id: string }[]
  const meta = TITLES[resource]

  return (
    <>
      <AdminPageHeader title={meta.title} description={meta.description} />
      {(resource === 'room_types' || resource === 'rooms') && (rows.length === 0 || loadError) ? (
        <RoomCatalogueBootstrap
          resource={resource}
          canImport={session.role === 'owner' && hasServiceRole()}
          loadError={loadError}
        />
      ) : null}
      <RecordManager
        resource={resource}
        singular={def.singular}
        fields={fields}
        rows={(rows ?? []) as (Record<string, unknown> & { id: string })[]}
        columns={columnsFor(fields)}
        refOptions={refOptions}
        currency={settings.data?.base_currency ?? 'MVR'}
        emptyMessage={
          loadError
            ? 'Unable to read this table. Apply the latest Supabase Data API grants migration and reload.'
            : resource === 'room_types'
              ? 'No room types are stored in Supabase yet.'
              : resource === 'rooms'
                ? 'No physical rooms are stored in Supabase yet.'
                : undefined
        }
        extra={
          resource === 'room_types'
            ? (row) => (
                <AmenityAssigner
                  roomTypeId={String(row.id)}
                  amenities={allAmenities}
                  selected={linkRows.filter((l) => l.room_type_id === row.id).map((l) => l.amenity_id)}
                />
              )
            : undefined
        }
      />
    </>
  )
}
