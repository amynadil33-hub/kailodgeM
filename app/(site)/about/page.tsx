import type { Metadata } from 'next'
import Image from 'next/image'
import { HeartPulse, MapPin, Waves } from 'lucide-react'
import { PageHero } from '@/components/site/page-hero'
import { Eyebrow, RuleDot } from '@/components/site/rule-dot'
import { getSiteData } from '@/lib/data'

export const metadata: Metadata = {
  title: 'About & Location',
  description: 'Kai Lodge is on Muranga Magu in Henveiru, Malé — close to IGMH, the artificial beach and local cafés.',
}

export default async function AboutPage() {
  const { content, settings, places } = await getSiteData()

  return (
    <>
      <PageHero
        eyebrow="About & Location"
        title={content['about.title']}
        image="/images/male-neighbourhood.png"
        imageAlt="A quiet residential lane in Henveiru, Malé"
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="flex flex-col gap-6 lg:col-span-6">
          <Eyebrow>Our story</Eyebrow>
          <p className="font-serif text-2xl leading-relaxed text-balance md:text-3xl">{content['about.story']}</p>
          <RuleDot align="start" />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg lg:col-span-6">
          <Image
            src={content['about.image'] || '/images/property-entrance.png'}
            alt="Kai Lodge entrance"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:px-8">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-8">
            <HeartPulse className="size-7 text-gold" aria-hidden="true" />
            <h2 className="text-2xl">Near IGMH</h2>
            <p className="leading-relaxed text-muted-foreground">{content['about.igmh_body']}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg bg-background p-8">
            <Waves className="size-7 text-gold" aria-hidden="true" />
            <h2 className="text-2xl">Close to the artificial beach</h2>
            <p className="leading-relaxed text-muted-foreground">{content['about.beach_body']}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Eyebrow>Getting here</Eyebrow>
          <h2 className="text-3xl md:text-4xl">Find Kai Lodge</h2>
          <p className="flex gap-3 leading-relaxed">
            <MapPin className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" />
            {settings.address}
          </p>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {places.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{p.name}</span>
                  {p.distance && <span className="shrink-0 text-sm text-muted-foreground">{p.distance}</span>}
                </div>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-h-96 overflow-hidden rounded-lg border border-border lg:col-span-7">
          <iframe
            title="Map showing Kai Lodge on Muranga Magu, Malé"
            src={
              settings.map_embed_url ||
              `https://www.google.com/maps?q=${encodeURIComponent('Muranga Magu, Malé, Maldives')}&output=embed`
            }
            className="h-full min-h-96 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  )
}
