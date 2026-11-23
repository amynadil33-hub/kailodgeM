'use client'

import { AmenityAssigner } from './amenity-assigner'
import { RecordManager, type Column } from './record-manager'
import { RoomTypePhotoManager, type AdminRoomPhoto } from './room-type-photo-manager'
import type { FieldDef } from '@/lib/admin/resources'

type Row = Record<string, unknown> & { id: string }

export function RoomTypeRecordManager({
  fields,
  rows,
  columns,
  currency,
  emptyMessage,
  amenities,
  amenityLinks,
  photos,
}: {
  fields: FieldDef[]
  rows: Row[]
  columns: Column[]
  currency: string
  emptyMessage?: string
  amenities: { id: string; name: string }[]
  amenityLinks: { room_type_id: string; amenity_id: string }[]
  photos: AdminRoomPhoto[]
}) {
  return (
    <RecordManager
      resource="room_types"
      singular="room type"
      fields={fields}
      rows={rows}
      columns={columns}
      currency={currency}
      emptyMessage={emptyMessage}
      extra={(row) => (
        <div className="flex flex-wrap items-center gap-2">
          <RoomTypePhotoManager
            roomTypeId={row.id}
            roomName={String(row.name ?? 'Room')}
            photos={photos.filter((photo) => photo.room_type_id === row.id)}
          />
          <AmenityAssigner
            roomTypeId={row.id}
            amenities={amenities}
            selected={amenityLinks.filter((link) => link.room_type_id === row.id).map((link) => link.amenity_id)}
          />
        </div>
      )}
    />
  )
}
