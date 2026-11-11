import { FlaskConical } from 'lucide-react'

export function DemoBanner() {
  return (
    <div role="note" className="bg-gold-soft text-ink">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium md:text-sm">
        <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>Demo mode.</strong> Rooms, prices and photos are samples. Availability is not live and no booking or
          payment will be recorded.
        </span>
      </p>
    </div>
  )
}
