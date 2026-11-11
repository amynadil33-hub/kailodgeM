'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { createBooking, getQuote, type BookingSubmission } from '@/app/actions/guest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatMoney } from '@/lib/format'
import type { DecorationPackage, Quote, RequestKind, RoomType, SiteSettings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DemoConfirmation } from './demo-confirmation'
import { QuoteSummary } from './quote-summary'

const REQUEST_OPTIONS: { kind: RequestKind; label: string; hint: string }[] = [
  { kind: 'airport_transfer', label: 'Airport transfer', hint: 'Flight number and arrival time' },
  { kind: 'early_check_in', label: 'Early check-in', hint: 'Preferred arrival time' },
  { kind: 'late_check_out', label: 'Late check-out', hint: 'Preferred departure time' },
  { kind: 'custom_decoration', label: 'Custom decoration', hint: 'Occasion, colours, names, ideas' },
  { kind: 'extended_stay', label: 'Extended / monthly stay', hint: 'How long you would like to stay' },
]

interface Props {
  roomType: RoomType
  search: { checkIn: string; checkOut: string; adults: number; children: number }
  packages: DecorationPackage[]
  settings: SiteSettings
  initialQuote: Quote
  demo: boolean
}

export function BookingForm({ roomType, search, packages, settings, initialQuote, demo }: Props) {
  const router = useRouter()
  const [quote, setQuote] = useState(initialQuote)
  const [packageIds, setPackageIds] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [codeMessage, setCodeMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [requests, setRequests] = useState<Partial<Record<RequestKind, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [demoResult, setDemoResult] = useState<{ reference: string; quote: Quote } | null>(null)
  const [quoting, startQuote] = useTransition()
  const [submitting, startSubmit] = useTransition()

  const base = { roomTypeId: roomType.id, ...search }

  function requote(next: { packageIds?: string[]; discountCode?: string }) {
    const ids = next.packageIds ?? packageIds
    const discountCode = next.discountCode ?? appliedCode
    startQuote(async () => {
      const res = await getQuote({ ...base, packageIds: ids, discountCode })
      if ('error' in res) {
        if (next.discountCode !== undefined) {
          setCodeMessage({ ok: false, text: res.error })
          setAppliedCode('')
        } else setError(res.error)
        return
      }
      setQuote(res.quote)
      if (next.discountCode !== undefined) {
        setAppliedCode(discountCode)
        setCodeMessage(discountCode ? { ok: true, text: res.discountName ?? 'Offer applied' } : null)
      }
    })
  }

  function togglePackage(id: string) {
    const ids = packageIds.includes(id) ? packageIds.filter((p) => p !== id) : [...packageIds, id]
    setPackageIds(ids)
    requote({ packageIds: ids })
  }

  function toggleRequest(kind: RequestKind) {
    setRequests((r) => {
      const next = { ...r }
      if (kind in next) delete next[kind]
      else next[kind] = ''
      return next
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload: BookingSubmission = {
      ...base,
      packageIds,
      discountCode: appliedCode,
      fullName: String(fd.get('fullName') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      country: String(fd.get('country') ?? ''),
      arrivalDetails: String(fd.get('arrivalDetails') ?? ''),
      specialRequests: String(fd.get('specialRequests') ?? ''),
      customRequests: Object.entries(requests).map(([kind, details]) => ({ kind: kind as RequestKind, details: details ?? '' })),
      website: String(fd.get('website') ?? ''),
    }
    setError(null)
    startSubmit(async () => {
      const res = await createBooking(payload)
      if (!res.ok) return setError(res.error)
      if ('demo' in res) return setDemoResult({ reference: res.reference, quote: res.quote })
      router.push(`/booking/${res.token}`)
    })
  }

  if (demoResult) return <DemoConfirmation reference={demoResult.reference} quote={demoResult.quote} settings={settings} />

  const pricedPackages = packages.filter((p) => p.price !== null)
  const quotedPackages = packages.filter((p) => p.price === null)

  return (
    <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-12">
        {pricedPackages.length > 0 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 font-serif text-2xl">Add a room decoration</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {pricedPackages.map((p) => {
                const on = packageIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      on ? 'border-gold bg-gold/5' : 'border-border hover:border-foreground/30',
                    )}
                  >
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => togglePackage(p.id)} />
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border',
                        on ? 'border-gold bg-gold text-ink' : 'border-border',
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{p.description}</span>
                      <span className="text-sm">{formatMoney(Number(p.price), settings.base_currency)}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {quotedPackages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Something bespoke? Choose “Custom decoration” below and we will send you a quote.
              </p>
            )}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-serif text-2xl">Anything else we should arrange?</legend>
          <p className="-mt-2 text-sm leading-relaxed text-muted-foreground">
            These are sent as requests. We will reply with a price where one applies, and you can accept or decline it from
            your booking page.
          </p>
          <div className="flex flex-col gap-3">
            {REQUEST_OPTIONS.map((opt) => {
              const on = opt.kind in requests
              return (
                <div key={opt.kind} className={cn('rounded-lg border p-4', on ? 'border-gold' : 'border-border')}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleRequest(opt.kind)}
                      className="size-4 accent-[var(--color-gold)]"
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                  {on && (
                    <Input
                      aria-label={`${opt.label} details`}
                      placeholder={opt.hint}
                      maxLength={1000}
                      className="mt-3"
                      value={requests[opt.kind] ?? ''}
                      onChange={(e) => setRequests((r) => ({ ...r, [opt.kind]: e.target.value }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 font-serif text-2xl">Your details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" maxLength={120} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" maxLength={160} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone / WhatsApp</Label>
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="+960 …" maxLength={24} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" autoComplete="country-name" maxLength={80} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="arrivalDetails">Arrival time / flight (optional)</Label>
              <Input id="arrivalDetails" name="arrivalDetails" maxLength={1000} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="specialRequests">Notes for our team (optional)</Label>
              <Textarea id="specialRequests" name="specialRequests" rows={4} maxLength={2000} />
            </div>
          </div>
          <div className="sr-only" aria-hidden>
            <label>
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Your stay</p>
            <h2 className="font-serif text-2xl">{roomType.name}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(search.checkIn)} – {formatDate(search.checkOut)} · {quote.nights}{' '}
              {quote.nights === 1 ? 'night' : 'nights'} · {search.adults} {search.adults === 1 ? 'adult' : 'adults'}
              {search.children > 0 && `, ${search.children} ${search.children === 1 ? 'child' : 'children'}`}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Offer code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={demo ? 'Try DEMO10' : 'Enter code'}
                maxLength={32}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                disabled={quoting || (!code && !appliedCode)}
                onClick={() => requote({ discountCode: appliedCode && code === appliedCode ? '' : code })}
              >
                {appliedCode && code === appliedCode ? 'Remove' : 'Apply'}
              </Button>
            </div>
            {codeMessage && (
              <p role="status" className={cn('text-sm', codeMessage.ok ? 'text-gold' : 'text-destructive')}>
                {codeMessage.text}
              </p>
            )}
          </div>

          <div className={cn('transition-opacity', quoting && 'opacity-50')} aria-busy={quoting}>
            <QuoteSummary quote={quote} />
          </div>

          {demo && (
            <p className="rounded-md bg-gold/10 p-3 text-xs leading-relaxed text-foreground">
              Demo mode — sample prices. Submitting will show a sample confirmation; nothing is saved.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Request booking
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your room is held for {settings.payment_deadline_hours} hours while you transfer the advance. Bank details are
            shown on the next screen.
          </p>
        </div>
      </aside>
    </form>
  )
}
