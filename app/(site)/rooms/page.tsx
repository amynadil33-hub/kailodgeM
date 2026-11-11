import type { Metadata } from 'next'
import { AvailabilitySearch } from '@/components/site/availability-search'
import { PageHero } from '@/components/site/page-hero'
import { RoomRow } from '@/components/site/room-row'
import { getSiteData } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Rooms',
  description: 'Queen rooms, balcony city-view rooms, recliner rooms and family rooms at Kai Lodge, Malé.',
}

export default async function RoomsPage() {
  const site = await getSiteData()
  return (
    <>
      <PageHero eyebrow="Rooms" title={site.content['rooms.title']} intro={site.content['rooms.intro']} />
      <div className="mx-auto -mt-8 max-w-5xl px-4 md:px-8">
        <AvailabilitySearch />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-20 md:gap-28 md:px-8 md:py-28">
        {site.roomTypes.map((room, i) => (
          <RoomRow key={room.id} room={room} amenities={site.amenities} settings={site.settings} demo={site.demo} index={i} />
        ))}
      </div>
    </>
  )
}
