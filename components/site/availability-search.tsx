'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { addDays, nightsBetween, todayMaldives } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  defaults?: { checkIn?: string; checkOut?: string; adults?: number; children?: number }
  variant?: 'hero' | 'panel'
  roomSlug?: string
}

export function AvailabilitySearch({ defaults, variant = 'panel', roomSlug }: Props) {
  const router = useRouter()
  const today = todayMaldives()
  const [checkIn, setCheckIn] = useState(defaults?.checkIn ?? addDays(today, 1))
  const [checkOut, setCheckOut] = useState(defaults?.checkOut ?? addDays(today, 3))
  const [adults, setAdults] = useState(defaults?.adults ?? 2)
  const [children, setChildren] = useState(defaults?.children ?? 0)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkIn || !checkOut) return setError('Choose your dates.')
    if (checkIn < today) return setError('Check-in cannot be in the past.')
    if (nightsBetween(checkIn, checkOut) < 1) return setError('Check-out must be after check-in.')
    setError(null)
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    })
    if (roomSlug) params.set('room', roomSlug)
    router.push(`/book?${params.toString()}`)
  }

  const hero = variant === 'hero'
  const field = cn(
    'h-12 w-full rounded-md border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold',
    hero ? 'border-ink-foreground/20 bg-ink/40 text-ink-foreground [color-scheme:dark]' : 'border-input bg-card text-foreground',
  )
  const label = cn('text-xs font-semibold uppercase tracking-[0.18em]', hero ? 'text-ink-foreground/70' : 'text-muted-foreground')

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Check availability"
      className={cn(
        'flex w-full flex-col gap-4 rounded-xl p-4 md:p-5',
        hero ? 'border border-ink-foreground/15 bg-ink/55 backdrop-blur-md' : 'border border-border bg-card',
      )}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_0.6fr_0.6fr_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${variant}-in`} className={label}>
            Check-in
          </label>
          <input
            id={`${variant}-in`}
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              if (e.target.value && checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1))
            }}
            className={field}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${variant}-out`} className={label}>
            Check-out
          </label>
          <input
            id={`${variant}-out`}
            type="date"
            min={checkIn ? addDays(checkIn, 1) : today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={field}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${variant}-adults`} className={label}>
            Adults
          </label>
          <select
            id={`${variant}-adults`}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className={field}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n} className="text-foreground">
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${variant}-children`} className={label}>
            Children
          </label>
          <select
            id={`${variant}-children`}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className={field}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n} className="text-foreground">
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold px-6 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft md:col-span-1"
        >
          <Search className="size-4" aria-hidden="true" />
          Check availability
        </button>
      </div>
      {error && (
        <p role="alert" className={cn('text-sm', hero ? 'text-gold-soft' : 'text-destructive')}>
          {error}
        </p>
      )}
    </form>
  )
}
