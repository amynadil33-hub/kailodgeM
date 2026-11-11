import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { AvailabilitySearch } from '@/components/site/availability-search'
import { BookingForm } from '@/components/booking/booking-form'
import { NightlyPrice } from '@/components/site/price'
import { buttonVariants } from '@/components/ui/button'
import { parseStaySearch, quoteForType, searchAvailability, type StaySearch } from '@/lib/booking-server'
import { formatDate, formatMoney, whatsappLink } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Book your stay',
  description: 'Check live availability and book your room at Kai Lodge Maldives in Muranga Magu, Malé.',
}

type Params = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

export default async function BookPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const raw = { checkIn: first(sp.checkIn), checkOut: first(sp.checkOut), adults: first(sp.adults), children: first(sp.children) }
  const hasSearch = Boolean(raw.checkIn && raw.checkOut)
  const parsed = hasSearch ? parseStaySearch(raw) : null
  const search = parsed && !('error' in parsed) ? parsed : null
  const roomSlug = first(sp.room)

  return (
    <main className="bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-24 pt-12 md:px-8 md:pt-16">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Reservations</p>
          <h1 className="font-serif text-4xl text-balance md:text-5xl">Book your stay</h1>
        </header>

        <AvailabilitySearch
          defaults={{
            checkIn: search?.checkIn ?? raw.checkIn,
            checkOut: search?.checkOut ?? raw.checkOut,
            adults: search?.adults,
            children: search?.children,
          }}
        />

        {parsed && 'error' in parsed && (
          <p role="alert" className="text-sm text-destructive">
            {parsed.error}
          </p>
        )}

        {search ? <Results search={search} roomSlug={roomSlug} /> : !hasSearch && <EmptyState />}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <p className="max-w-xl leading-relaxed text-muted-foreground">
      Choose your dates and guests above to see which rooms are free and the full price for your stay.
    </p>
  )
}

async function Results({ search, roomSlug }: { search: StaySearch; roomSlug?: string }) {
  const { site, options } = await searchAvailability(search)
  const selected = roomSlug ? options.find((o) => o.roomType.slug === roomSlug) : undefined
  const params = new URLSearchParams({
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    adults: String(search.adults),
    children: String(search.children),
  })

  if (selected && selected.available && selected.fits) {
    return (
      <section aria-labelledby="checkout-heading" className="flex flex-col gap-8 border-t border-border pt-10">
        <div className="flex flex-col gap-3">
          <Link
            href={`/book?${params.toString()}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All rooms for these dates
          </Link>
          <h2 id="checkout-heading" className="font-serif text-3xl">
            Complete your booking
          </h2>
        </div>
        <BookingForm
          roomType={selected.roomType}
          search={search}
          packages={site.packages}
          settings={site.settings}
          initialQuote={quoteForType(site, selected.roomType, search)}
          demo={site.demo}
        />
      </section>
    )
  }

  const bookable = options.filter((o) => o.available && o.fits)

  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-6 border-t border-border pt-10">
      <div className="flex flex-col gap-1">
        <h2 id="results-heading" className="font-serif text-3xl">
          {bookable.length > 0 ? 'Available rooms' : 'No rooms free for these dates'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatDate(search.checkIn)} – {formatDate(search.checkOut)} · {options[0]?.quote.nights ?? 0} nights ·{' '}
          {search.adults + search.children} guests
          {site.demo && ' · Demo availability'}
        </p>
      </div>

      {selected && !(selected.available && selected.fits) && (
        <p role="status" className="rounded-md bg-gold/10 p-4 text-sm">
          {selected.roomType.name} is {selected.fits ? 'fully booked' : 'not suitable for that many guests'} — here are the
          other options.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {options.map(({ roomType: rt, available, fits, quote }) => {
          const bookableRow = available && fits
          const img = rt.images[0]
          return (
            <li key={rt.id} className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-56">
                {img && <Image src={img.url} alt={img.alt} fill sizes="(min-width: 640px) 224px, 100vw" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="font-serif text-2xl">{rt.name}</h3>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  Up to {rt.max_guests} guests{rt.bed && ` · ${rt.bed}`}
                </p>
                {!bookableRow && (
                  <p className="text-sm font-medium text-destructive">
                    {fits ? 'Fully booked for these dates' : 'Too many guests for this room'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <NightlyPrice amount={Math.round(quote.room_subtotal / Math.max(1, quote.nights))} settings={site.settings} prefix="Avg." demo={site.demo} />
                <p className="text-sm text-muted-foreground">
                  Total <span className="font-medium text-foreground">{formatMoney(quote.grand_total, quote.currency)}</span>
                </p>
                {bookableRow ? (
                  <Link href={`/book?${params.toString()}&room=${rt.slug}`} className={buttonVariants()}>
                    Select room
                  </Link>
                ) : (
                  <a
                    href={whatsappLink(site.settings.whatsapp, `Hi Kai Lodge, is the ${rt.name} free around ${search.checkIn}?`)}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Ask on WhatsApp
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
