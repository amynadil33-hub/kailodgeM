import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { Quote, SiteSettings } from '@/lib/types'
import { BankDetails } from './bank-details'
import { QuoteSummary } from './quote-summary'

const SAMPLE_ACCOUNT = {
  id: 'demo',
  bank_name: 'Bank of Maldives (sample)',
  account_name: 'Kai Lodge Maldives',
  account_number: '7700-000000-000',
  currency: 'USD',
  swift: null,
  notes: 'Sample details — replace in the admin dashboard.',
  active: true,
  sort: 0,
}

export function DemoConfirmation({
  reference,
  quote,
  settings,
  emailed,
}: {
  reference: string
  quote: Quote
  settings: SiteSettings
  emailed: boolean
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-start gap-4">
        <CheckCircle2 className="size-10 text-gold" aria-hidden />
        <h2 className="font-serif text-4xl text-balance">{emailed ? 'Booking request sent' : 'Sample booking received'}</h2>
        <p className="leading-relaxed text-muted-foreground">
          {emailed
            ? 'Your booking request has been emailed to Kai Lodge. The team will contact you to confirm availability and payment details.'
            : 'Email delivery is not configured, so this request was not sent. Please contact Kai Lodge by WhatsApp.'}{' '}
          Reference <span className="font-mono text-foreground">{reference}</span>
        </p>
      </div>
      <QuoteSummary quote={quote} />
      <BankDetails
        accounts={[SAMPLE_ACCOUNT]}
        reference={reference}
        amount={quote.advance_amount}
        currency={quote.currency}
        deadlineHours={settings.payment_deadline_hours}
      />
      <Link href="/" className={buttonVariants({ variant: 'outline', className: 'self-start' })}>
        Back to home
      </Link>
    </div>
  )
}
