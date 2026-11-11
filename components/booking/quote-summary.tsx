import { formatMoney } from '@/lib/format'
import type { Quote } from '@/lib/types'
import { cn } from '@/lib/utils'

export function QuoteSummary({ quote, className, showAdvance = true }: { quote: Quote; className?: string; showAdvance?: boolean }) {
  const m = (n: number) => formatMoney(n, quote.currency)
  return (
    <dl className={cn('flex flex-col gap-3 text-sm', className)}>
      {quote.lines.map((line, i) => (
        <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{line.label}</dt>
          <dd className={cn('tabular-nums', line.kind === 'discount' && 'text-gold')}>
            {line.kind === 'discount' ? `− ${m(Math.abs(line.amount))}` : m(line.amount)}
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="font-medium">Total</dt>
        <dd className="font-serif text-2xl tabular-nums">{m(quote.grand_total)}</dd>
      </div>
      {showAdvance && quote.advance_amount > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Advance to confirm ({quote.advance_percent}%)</dt>
            <dd className="font-medium tabular-nums">{m(quote.advance_amount)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Balance on arrival</dt>
            <dd className="tabular-nums">{m(quote.balance_amount)}</dd>
          </div>
        </>
      )}
    </dl>
  )
}
