'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { submitPaymentReference } from '@/app/actions/guest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PaymentReferenceForm({ token, suggestedAmount }: { token: string; suggestedAmount: number }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    start(async () => {
      const res = await submitPaymentReference(token, {
        amount: Number(fd.get('amount')),
        reference: String(fd.get('reference') ?? ''),
      })
      if (res.ok) {
        form.reset()
        setMessage({ ok: true, text: 'Thank you — our team will verify your transfer and confirm your booking.' })
      } else setMessage({ ok: false, text: res.error ?? 'Something went wrong.' })
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-border p-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-2xl">I have made the transfer</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let us know the amount and your bank&apos;s transaction reference so we can match it.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount sent</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={suggestedAmount} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reference">Transaction reference</Label>
          <Input id="reference" name="reference" required minLength={3} maxLength={200} />
        </div>
      </div>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'text-sm text-gold' : 'text-sm text-destructive'}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send payment details
      </Button>
    </form>
  )
}
