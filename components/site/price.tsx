import { formatMoney, secondaryPrice } from '@/lib/format'
import type { SiteSettings } from '@/lib/types'
import { cn } from '@/lib/utils'

export function NightlyPrice({
  amount,
  settings,
  demo,
  className,
  prefix = 'From',
}: {
  amount: number
  settings: SiteSettings
  demo?: boolean
  className?: string
  prefix?: string
}) {
  const secondary = secondaryPrice(amount, settings.base_currency, settings.usd_to_mvr_rate)
  return (
    <p className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-sm text-muted-foreground">
        {prefix} <span className="font-serif text-2xl text-foreground">{formatMoney(amount, settings.base_currency)}</span>{' '}
        / night
      </span>
      {secondary && <span className="text-xs text-muted-foreground">approx. {secondary}</span>}
      {demo && <span className="text-xs font-medium text-gold">Sample rate</span>}
    </p>
  )
}
