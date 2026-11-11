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

export function DemoConfirmation({ reference, quote, settings }: { reference: string; quote: Quote; settings: SiteSettings }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-start gap-4">
        <CheckCircle2 className="size-10 text-gold" aria-hidden />
        <h2 className="font-serif text-4xl text-balance">Sample booking received</h2>
        <p className="leading-relaxed text-muted-foreground">
          This is how guests see their confirmation. In demo mode nothing is saved — connect Supabase to take real
          bookings. Reference <span className="font-mono text-foreground">{reference}</span>
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
