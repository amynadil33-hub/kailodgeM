import { formatMoney } from '@/lib/format'
import type { BankAccount } from '@/lib/types'

export function BankDetails({
  accounts,
  reference,
  amount,
  currency,
  deadlineHours,
}: {
  accounts: BankAccount[]
  reference: string
  amount: number
  currency: string
  deadlineHours?: number
}) {
  return (
    <section aria-labelledby="bank-heading" className="flex flex-col gap-5 rounded-xl bg-ink p-6 text-ink-foreground">
      <div className="flex flex-col gap-2">
        <h3 id="bank-heading" className="font-serif text-2xl">
          Transfer the advance
        </h3>
        <p className="text-sm leading-relaxed text-ink-foreground/75">
          Send <span className="font-medium text-gold-soft">{formatMoney(amount, currency)}</span> and use{' '}
          <span className="font-mono text-gold-soft">{reference}</span> as the transfer reference.
          {deadlineHours ? ` Your room is held for ${deadlineHours} hours.` : ''}
        </p>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-ink-foreground/75">Our team will send bank details on WhatsApp shortly.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {accounts.map((a) => (
            <li key={a.id} className="border-t border-ink-foreground/15 pt-4 first:border-0 first:pt-0">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="text-ink-foreground/60">Bank</dt>
                <dd>{a.bank_name}</dd>
                <dt className="text-ink-foreground/60">Account name</dt>
                <dd>{a.account_name}</dd>
                <dt className="text-ink-foreground/60">Account no.</dt>
                <dd className="font-mono">{a.account_number}</dd>
                {a.currency && (
                  <>
                    <dt className="text-ink-foreground/60">Currency</dt>
                    <dd>{a.currency}</dd>
                  </>
                )}
                {a.swift && (
                  <>
                    <dt className="text-ink-foreground/60">SWIFT</dt>
                    <dd className="font-mono">{a.swift}</dd>
                  </>
                )}
              </dl>
              {a.notes && <p className="mt-2 text-xs text-ink-foreground/60">{a.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
