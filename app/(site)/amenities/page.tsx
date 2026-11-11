import type { Metadata } from 'next'
import Image from 'next/image'
import { KeyRound } from 'lucide-react'
import { AmenityIcon } from '@/components/site/amenity-icon'
import { BookingCta } from '@/components/site/booking-cta'
import { PageHero } from '@/components/site/page-hero'
import { Eyebrow } from '@/components/site/rule-dot'
import { getSiteData } from '@/lib/data'
import type { Amenity } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Amenities',
  description: 'In-room comforts, a shared equipped kitchen, laundry and 24/7 access at Kai Lodge, Malé.',
}

function AmenityList({ items }: { items: Amenity[] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <li key={a.id} className="flex gap-4 bg-background p-6">
          <AmenityIcon name={a.icon} className="size-6 shrink-0 text-gold" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">{a.name}</p>
            {a.description && <p className="text-sm leading-relaxed text-muted-foreground">{a.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function AmenitiesPage() {
  const { content, amenities, settings } = await getSiteData()
  const room = amenities.filter((a) => a.scope === 'room')
  const property = amenities.filter((a) => a.scope === 'property')

  return (
    <>
      <PageHero eyebrow="Amenities" title={content['amenities.title']} intro={content['amenities.intro']} />

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 md:px-8">
        <div className="flex flex-col gap-3">
          <Eyebrow>In your room</Eyebrow>
          <h2 className="text-3xl md:text-4xl">Room comforts</h2>
          <p className="text-muted-foreground">Some features, like balconies and recliners, depend on the room type.</p>
        </div>
        <AmenityList items={room} />
      </section>

      <section className="border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Eyebrow>Shared spaces</Eyebrow>
            <h2 className="text-3xl md:text-4xl">Live like a local</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={content['amenities.image'] || '/images/property-kitchen.png'}
                alt="The shared kitchen at Kai Lodge with a microwave, rice cooker and kettle"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <p className="flex gap-3 rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
              <KeyRound className="size-5 shrink-0 text-gold" aria-hidden="true" />
              {content['amenities.access_note']}
            </p>
          </div>
          <div className="lg:col-span-7">
            <AmenityList items={property} />
          </div>
        </div>
      </section>

      <BookingCta title={content['home.cta_title']} body={content['home.cta_body']} whatsapp={settings.whatsapp} />
    </>
  )
}
