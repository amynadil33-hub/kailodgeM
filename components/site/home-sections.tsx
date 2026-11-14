import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import type { SiteData } from '@/lib/data'
import { AmenityIcon } from './amenity-icon'
import { AvailabilitySearch } from './availability-search'
import { Eyebrow, RuleDot } from './rule-dot'

export function HomeHero({ content }: { content: SiteData['content'] }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      <Image
        src={content['home.hero_image'] || '/images/room-balcony-1.png'}
        alt="Kai Lodge queen room with warm lighting, a hanging chair and private balcony"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/30" aria-hidden="true" />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col justify-end gap-10 px-4 pt-32 pb-10 md:min-h-[calc(100dvh-5rem)] md:px-8 md:pb-14">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow className="reveal text-gold-soft">{content['home.hero_eyebrow']}</Eyebrow>
          <h1 className="reveal text-5xl leading-[1.05] text-balance md:text-7xl" style={{ animationDelay: '120ms' }}>
            {content['home.hero_title']}
          </h1>
          <p
            className="reveal max-w-xl text-lg leading-relaxed text-ink-foreground/85 text-pretty"
            style={{ animationDelay: '240ms' }}
          >
            {content['home.hero_subtitle']}
          </p>
        </div>
        <div className="reveal" style={{ animationDelay: '380ms' }}>
          <AvailabilitySearch variant="hero" />
        </div>
      </div>
    </section>
  )
}

export function HomeIntro({ content, address }: { content: SiteData['content']; address: string }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:items-center md:px-8 md:py-28">
      <div className="flex flex-col gap-6 md:col-span-6 lg:col-span-5">
        <Eyebrow>Welcome to Kai Lodge</Eyebrow>
        <h2 className="text-4xl text-balance md:text-5xl">{content['home.intro_title']}</h2>
        <RuleDot align="start" />
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{content['home.intro_body']}</p>
        <p className="flex items-start gap-2 text-sm text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          {address}
        </p>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted md:col-span-6 lg:col-span-6 lg:col-start-7">
        <Image
          src={content['home.intro_image'] || '/images/property-entrance.png'}
          alt="The warm, welcoming Kai Lodge entrance and reception"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  )
}

export function HomePersonalise({ content, packages }: { content: SiteData['content']; packages: SiteData['packages'] }) {
  const shown = packages.slice(0, 4)
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-5">
            <Eyebrow className="text-gold-soft">Personalised stays</Eyebrow>
            <h2 className="text-4xl text-balance md:text-5xl">{content['home.personal_title']}</h2>
            <p className="text-lg leading-relaxed text-ink-foreground/75 text-pretty">{content['home.personal_body']}</p>
          </div>
          <Link
            href="/personalise"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-gold-soft"
          >
            See all occasions
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id} className="flex flex-col gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink-foreground/5">
                {p.image_url && (
                  <Image src={p.image_url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl">{p.name}</h3>
                {p.description && (
                  <p className="text-sm leading-relaxed text-ink-foreground/65 line-clamp-2">{p.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function HomeAmenities({ amenities }: { amenities: SiteData['amenities'] }) {
  const highlight = ['wifi', 'kitchen', 'washing-machine', 'access-24-7', 'recliner', 'balcony', 'safe', 'smart-tv']
  const shown = highlight
    .map((slug) => amenities.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
  const list = shown.length >= 4 ? shown : amenities.slice(0, 8)

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 md:py-28">
      <div className="flex flex-col items-center gap-5 text-center">
        <Eyebrow>Everyday comfort</Eyebrow>
        <h2 className="max-w-2xl text-4xl text-balance md:text-5xl">Everything you need, nothing you don&apos;t</h2>
      </div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-3 bg-background p-6">
            <AmenityIcon name={a.icon} className="size-6 text-gold" />
            <p className="font-medium">{a.name}</p>
          </li>
        ))}
      </ul>
      <Link href="/amenities" className="group mx-auto inline-flex items-center gap-2 text-sm font-semibold">
        All amenities
        <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </section>
  )
}

export function HomeCity({ content, places }: { content: SiteData['content']; places: SiteData['places'] }) {
  const photos = places.filter((p) => p.image_url).slice(0, 3)
  return (
    <section className="border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Eyebrow>The neighbourhood</Eyebrow>
          <h2 className="text-4xl text-balance md:text-5xl">{content['home.city_title']}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{content['home.city_body']}</p>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {places.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-4 py-3">
                <span className="font-medium">{p.name}</span>
                {p.distance && <span className="shrink-0 text-sm text-muted-foreground">{p.distance}</span>}
              </li>
            ))}
          </ul>
          <Link href="/about" className="group inline-flex items-center gap-2 text-sm font-semibold">
            About the location
            <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-7">
          {photos.map((p, i) => (
            <figure
              key={p.id}
              className={i === 0 ? 'relative col-span-2 aspect-[16/9] overflow-hidden rounded-lg' : 'relative aspect-square overflow-hidden rounded-lg'}
            >
              <Image src={p.image_url as string} alt={p.name} fill sizes="(min-width: 1024px) 40vw, 50vw" className="object-cover" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-ink-foreground">
                {p.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
