import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BedDouble, Users } from 'lucide-react'
import { AmenityIcon } from '@/components/site/amenity-icon'
import { AvailabilitySearch } from '@/components/site/availability-search'
import { PhotoGallery } from '@/components/site/photo-gallery'
import { NightlyPrice } from '@/components/site/price'
import { Eyebrow, RuleDot } from '@/components/site/rule-dot'
import { getSiteData } from '@/lib/data'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const site = await getSiteData()
  const room = site.roomTypes.find((r) => r.slug === slug)
  if (!room) return { title: 'Room not found' }
  return { title: room.name, description: room.tagline ?? room.description ?? undefined }
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getSiteData()
  const room = site.roomTypes.find((r) => r.slug === slug)
  if (!room) notFound()

  const roomAmenities = site.amenities.filter((a) => room.amenity_ids.includes(a.id))
  const propertyAmenities = site.amenities.filter((a) => a.scope === 'property')
  const others = site.roomTypes.filter((r) => r.id !== room.id)

  return (
    <article className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-10 md:px-8 md:py-14">
      <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All rooms
      </Link>

      <header className="flex flex-col gap-5">
        <Eyebrow>Room</Eyebrow>
        <h1 className="text-4xl text-balance md:text-6xl">{room.name}</h1>
        {room.tagline && <p className="max-w-2xl text-xl text-muted-foreground text-pretty">{room.tagline}</p>}
      </header>

      <PhotoGallery items={room.images} />

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-7">
          {room.description && <p className="text-lg leading-relaxed text-pretty">{room.description}</p>}
          <dl className="grid grid-cols-2 gap-6 border-y border-border py-6">
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Users className="size-4 text-gold" aria-hidden="true" /> Guests
              </dt>
              <dd>
                Up to {room.max_guests} ({room.max_adults} adults
                {room.max_children > 0 ? `, ${room.max_children} children` : ''})
              </dd>
            </div>
            {room.bed && (
              <div className="flex flex-col gap-1">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <BedDouble className="size-4 text-gold" aria-hidden="true" /> Bed
                </dt>
                <dd>{room.bed}</dd>
              </div>
            )}
          </dl>

          <section className="flex flex-col gap-5" aria-labelledby="in-room">
            <h2 id="in-room" className="text-2xl">
              In the room
            </h2>
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {roomAmenities.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <AmenityIcon name={a.icon} className="size-5 text-gold" />
                  {a.name}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-5" aria-labelledby="shared">
            <h2 id="shared" className="text-2xl">
              Shared at the lodge
            </h2>
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {propertyAmenities.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-muted-foreground">
                  <AmenityIcon name={a.icon} className="size-5 text-gold" />
                  {a.name}
                </li>
              ))}
            </ul>
          </section>

          {site.settings.policies && (
            <section className="flex flex-col gap-3 rounded-lg bg-secondary p-6" aria-labelledby="policies">
              <h2 id="policies" className="text-2xl">
                Good to know
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{site.settings.policies}</p>
              {(site.settings.check_in_time || site.settings.check_out_time) && (
                <p className="text-sm">
                  Check-in from {site.settings.check_in_time ?? '—'} · Check-out by {site.settings.check_out_time ?? '—'}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-28 flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
            <NightlyPrice amount={room.base_rate} settings={site.settings} demo={site.demo} />
            <p className="text-sm text-muted-foreground">
              Rates may vary by season. Your exact total, including any fees, is shown before you confirm.
            </p>
            <RuleDot align="start" />
            <AvailabilitySearch roomSlug={room.slug} />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="flex flex-col gap-6 border-t border-border pt-12" aria-labelledby="others">
          <h2 id="others" className="text-3xl">
            Other rooms
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {others.map((r) => (
              <li key={r.id}>
                <Link href={`/rooms/${r.slug}`} className="flex flex-col gap-1 rounded-lg border border-border p-5 hover:border-gold">
                  <span className="font-serif text-xl">{r.name}</span>
                  <span className="text-sm text-muted-foreground">{r.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
