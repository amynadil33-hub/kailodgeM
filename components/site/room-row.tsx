import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import type { Amenity, RoomType, SiteSettings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AmenityIcon } from './amenity-icon'
import { NightlyPrice } from './price'

export function RoomRow({
  room,
  amenities,
  settings,
  demo,
  index,
}: {
  room: RoomType
  amenities: Amenity[]
  settings: SiteSettings
  demo: boolean
  index: number
}) {
  const flipped = index % 2 === 1
  const cover = room.images[0]
  const second = room.images[1]
  const highlights = amenities.filter((a) => room.amenity_ids.includes(a.id)).slice(-4)

  return (
    <article className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
      <div className={cn('relative md:col-span-7', flipped && 'md:order-2')}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          ) : null}
        </div>
        {second && (
          <div
            className={cn(
              'absolute -bottom-8 hidden aspect-square w-40 overflow-hidden rounded-lg border-4 border-background lg:block',
              flipped ? '-left-8' : '-right-8',
            )}
          >
            <Image src={second.url} alt={second.alt} fill sizes="160px" className="object-cover" />
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-5 md:col-span-5', flipped && 'md:order-1')}>
        <div className="flex flex-col gap-2">
          <h3 className="text-3xl text-balance md:text-4xl">{room.name}</h3>
          {room.tagline && <p className="text-lg text-muted-foreground text-pretty">{room.tagline}</p>}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4 text-gold" aria-hidden="true" />
          Up to {room.max_guests} guests{room.bed ? ` · ${room.bed}` : ''}
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Room highlights">
          {highlights.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              <AmenityIcon name={a.icon} className="size-3.5 text-gold" />
              {a.name}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
          <NightlyPrice amount={room.base_rate} settings={settings} demo={demo} />
          <Link
            href={`/rooms/${room.slug}`}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            View room
            <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
