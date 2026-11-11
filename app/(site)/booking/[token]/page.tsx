import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BankDetails } from '@/components/booking/bank-details'
import { PaymentReferenceForm } from '@/components/booking/payment-reference-form'
import { QuoteResponse } from '@/components/booking/quote-response'
import { QuoteSummary } from '@/components/booking/quote-summary'
import { Badge } from '@/components/ui/badge'
import { getSiteData } from '@/lib/data'
import { formatDate, formatMoney, whatsappLink } from '@/lib/format'
import { getGuestBooking } from '@/lib/guest-booking'

export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
}

const STATUS_COPY: Record<string, { label: string; text: string }> = {
  pending: { label: 'Awaiting advance', text: 'Your room is on hold. Transfer the advance to confirm it.' },
  confirmed: { label: 'Confirmed', text: 'Your stay is confirmed. We look forward to welcoming you.' },
  checked_in: { label: 'Checked in', text: 'Welcome to Kai Lodge.' },
  checked_out: { label: 'Completed', text: 'Thank you for staying with us.' },
  cancelled: { label: 'Cancelled', text: 'This booking has been cancelled.' },
  expired: { label: 'Expired', text: 'The hold expired before payment arrived. Message us and we will try to re-book you.' },
  no_show: { label: 'No-show', text: 'This booking was marked as a no-show.' },
}

const REQUEST_STATUS: Record<string, string> = {
  included: 'Included',
  quote_pending: 'Awaiting our quote',
  quoted: 'Quote ready',
  accepted: 'Accepted',
  declined: 'Declined',
  fulfilled: 'Arranged',
  cancelled: 'Cancelled',
}

export default async function GuestBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [result, site] = await Promise.all([getGuestBooking(token), getSiteData()])
  if (!result) notFound()
  const { booking, accounts } = result
  const status = STATUS_COPY[booking.reservation_status] ?? STATUS_COPY.pending
  const verified = booking.payments.filter((p) => p.status === 'verified').reduce((s, p) => s + p.amount, 0)
  const awaitingVerification = booking.payments.some((p) => p.status === 'pending')
  const owingAdvance = booking.reservation_status === 'pending' && verified < booking.advance_amount
  const m = (n: number) => formatMoney(n, booking.currency)

  return (
    <main className="bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-12 md:px-8 md:pt-16 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Booking {booking.reference}</p>
            <h1 className="font-serif text-4xl text-balance md:text-5xl">
              {booking.customer?.full_name ? `Thank you, ${booking.customer.full_name.split(' ')[0]}.` : 'Your booking'}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={booking.reservation_status === 'confirmed' ? 'default' : 'secondary'}>{status.label}</Badge>
              {awaitingVerification && <Badge variant="outline">Payment being verified</Badge>}
            </div>
            <p className="max-w-xl leading-relaxed text-muted-foreground">{status.text}</p>
            {booking.reservation_status === 'pending' && booking.hold_expires_at && (
              <p className="text-sm">
                Hold expires{' '}
                <time dateTime={booking.hold_expires_at} className="font-medium">
                  {new Date(booking.hold_expires_at).toLocaleString('en-GB', {
                    timeZone: 'Indian/Maldives',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  (Malé time)
                </time>
              </p>
            )}
            <p className="text-xs text-muted-foreground">Bookmark this page — it is your private link to this booking.</p>
          </header>

          {owingAdvance && (
            <>
              <BankDetails
                accounts={accounts}
                reference={booking.reference}
                amount={booking.advance_amount - verified}
                currency={booking.currency}
              />
              <PaymentReferenceForm token={token} suggestedAmount={booking.advance_amount - verified} />
            </>
          )}

          {booking.requests.length > 0 && (
            <section aria-labelledby="requests-heading" className="flex flex-col gap-4">
              <h2 id="requests-heading" className="font-serif text-2xl">
                Requests &amp; extras
              </h2>
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {booking.requests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{r.title}</p>
                      {r.details && <p className="text-sm leading-relaxed text-muted-foreground">{r.details}</p>}
                      <p className="text-xs uppercase tracking-wider text-gold">{REQUEST_STATUS[r.status] ?? r.status}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {r.amount !== null && <p className="tabular-nums">{m(r.amount)}</p>}
                      {r.status === 'quoted' && <QuoteResponse token={token} requestId={r.id} />}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {booking.payments.length > 0 && (
            <section aria-labelledby="payments-heading" className="flex flex-col gap-4">
              <h2 id="payments-heading" className="font-serif text-2xl">
                Payments
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {booking.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-4 border-b border-border pb-2">
                    <span>
                      {formatDate(p.created_at.slice(0, 10))} · {p.reference_note}
                    </span>
                    <span className="tabular-nums">
                      {m(p.amount)} · <span className="capitalize text-muted-foreground">{p.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl">{booking.room_type?.name ?? 'Your room'}</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(booking.check_in)} – {formatDate(booking.check_out)} · {booking.adults} adults
                {booking.children > 0 && `, ${booking.children} children`}
              </p>
            </div>
            <QuoteSummary quote={{ ...booking.price_breakdown, grand_total: booking.grand_total }} showAdvance={false} />
            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid &amp; verified</dt>
                <dd className="tabular-nums">{m(verified)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Remaining</dt>
                <dd className="font-medium tabular-nums">{m(Math.max(0, booking.grand_total - verified))}</dd>
              </div>
            </dl>
            <a
              href={whatsappLink(site.settings.whatsapp, `Hi Kai Lodge, about my booking ${booking.reference}`)}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Questions? Message us on WhatsApp
            </a>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Kai Lodge
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
