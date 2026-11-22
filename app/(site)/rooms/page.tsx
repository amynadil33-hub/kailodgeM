import type { Metadata } from 'next'
import Link from 'next/link'
import { AvailabilitySearch } from '@/components/site/availability-search'
import { PageHero } from '@/components/site/page-hero'
import { PhotoGallery } from '@/components/site/photo-gallery'
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
      {site.roomTypes.length > 0 ? (
        <>
          <div className="mx-auto -mt-8 max-w-5xl px-4 md:px-8">
            <AvailabilitySearch />
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-20 md:gap-28 md:px-8 md:py-28">
            {site.roomTypes.map((room, i) => (
              <RoomRow key={room.id} room={room} amenities={site.amenities} settings={site.settings} demo={site.demo} index={i} />
            ))}
          </div>
        </>
      ) : (
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:px-8">
          <Link href="/contact" className="self-start text-sm font-semibold underline underline-offset-4">
            Ask about room availability
          </Link>
          <PhotoGallery items={site.media.filter((photo) => photo.category === 'room')} layout="grid" />
        </section>
      )}
    </>
  )
}
