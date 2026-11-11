import { BookingCta } from '@/components/site/booking-cta'
import { HomeAmenities, HomeCity, HomeHero, HomeIntro, HomePersonalise } from '@/components/site/home-sections'
import { RoomRow } from '@/components/site/room-row'
import { Eyebrow } from '@/components/site/rule-dot'
import { getSiteData } from '@/lib/data'

export default async function HomePage() {
  const site = await getSiteData()
  const { content, settings } = site

  return (
    <>
      <HomeHero content={content} />
      <HomeIntro content={content} address={settings.address} />

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-20 md:gap-24 md:px-8 md:py-28">
          <div className="flex flex-col gap-4">
            <Eyebrow>Our rooms</Eyebrow>
            <h2 className="max-w-2xl text-4xl text-balance md:text-5xl">{content['rooms.title']}</h2>
          </div>
          {site.roomTypes.slice(0, 3).map((room, i) => (
            <RoomRow key={room.id} room={room} amenities={site.amenities} settings={settings} demo={site.demo} index={i} />
          ))}
        </div>
      </section>

      <HomePersonalise content={content} packages={site.packages} />
      <HomeAmenities amenities={site.amenities} />
      <HomeCity content={content} places={site.places} />
      <BookingCta title={content['home.cta_title']} body={content['home.cta_body']} whatsapp={settings.whatsapp} />
    </>
  )
}
