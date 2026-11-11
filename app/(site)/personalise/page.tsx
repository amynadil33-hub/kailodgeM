import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, Clock, Plane } from 'lucide-react'
import { PageHero } from '@/components/site/page-hero'
import { Eyebrow } from '@/components/site/rule-dot'
import { formatMoney, whatsappLink } from '@/lib/format'
import { getSiteData } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Personalise your stay',
  description:
    'Birthday, anniversary, honeymoon and romantic room decorations, airport transfers, early arrivals and extended stays at Kai Lodge.',
}

export default async function PersonalisePage() {
  const { content, packages, settings, demo } = await getSiteData()

  const services = [
    { icon: Plane, title: 'Airport transfer', body: content['personalise.transfer_body'] },
    { icon: Clock, title: 'Early arrival or late departure', body: content['personalise.arrival_body'] },
    { icon: CalendarPlus, title: 'Extended stays', body: content['personalise.extended_body'] },
  ]

  return (
    <>
      <PageHero
        eyebrow="Personalise"
        title={content['personalise.title']}
        intro={content['personalise.intro']}
        image={content['personalise.image'] || '/images/decor-romantic.png'}
        imageAlt="A room decorated with candles and rose petals"
      />

      <section className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-3">
          <Eyebrow>Occasions</Eyebrow>
          <h2 className="text-3xl md:text-4xl">Decoration packages</h2>
          <p className="max-w-2xl text-muted-foreground text-pretty">
            Add a package while booking, or describe your own idea. Packages without a listed price are quoted by our
            team after you book.
          </p>
        </div>
        <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2">
          {packages.map((p) => (
            <li key={p.id} className="flex flex-col gap-5">
              <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-muted">
                {p.image_url && (
                  <Image src={p.image_url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                )}
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl">{p.name}</h3>
                  {p.description && <p className="leading-relaxed text-muted-foreground text-pretty">{p.description}</p>}
                </div>
                <p className="shrink-0 text-right">
                  {p.price !== null ? (
                    <span className="font-serif text-xl">{formatMoney(p.price, settings.base_currency)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">On request</span>
                  )}
                  {demo && p.price !== null && <span className="block text-xs text-gold">Sample price</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 md:py-28">
          <div className="flex flex-col gap-3">
            <Eyebrow className="text-gold-soft">Around your stay</Eyebrow>
            <h2 className="text-3xl md:text-4xl">Little things, arranged for you</h2>
          </div>
          <ul className="grid gap-10 md:grid-cols-3">
            {services.map((s) => (
              <li key={s.title} className="flex flex-col gap-4 border-t border-ink-foreground/15 pt-6">
                <s.icon className="size-6 text-gold-soft" aria-hidden="true" />
                <h3 className="text-2xl">{s.title}</h3>
                <p className="leading-relaxed text-ink-foreground/75">{s.body}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold text-ink hover:bg-gold-soft"
            >
              Book and add requests
            </Link>
            <a
              href={whatsappLink(settings.whatsapp, 'Hello Kai Lodge, I would like to arrange something special for my stay.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 px-8 text-sm font-semibold hover:border-gold-soft"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
