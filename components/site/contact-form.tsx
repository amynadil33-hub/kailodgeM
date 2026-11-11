'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { sendEnquiry } from '@/app/actions/guest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ demo: boolean } | null>(null)

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-8">
        <CheckCircle2 className="size-8 text-gold" aria-hidden="true" />
        <h2 className="text-2xl">Thank you — we&apos;ll be in touch.</h2>
        <p className="text-muted-foreground">
          {sent.demo
            ? 'Demo mode: your message was validated but not stored. Connect Supabase to receive enquiries.'
            : 'Our team usually replies within a few hours.'}
        </p>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        setError(null)
        start(async () => {
          const res = await sendEnquiry({
            name: String(f.get('name') ?? ''),
            email: String(f.get('email') ?? ''),
            phone: String(f.get('phone') ?? ''),
            subject: String(f.get('subject') ?? ''),
            message: String(f.get('message') ?? ''),
            website: String(f.get('website') ?? ''),
          })
          if (res.ok) setSent({ demo: Boolean(res.demo) })
          else setError(res.error ?? 'Something went wrong.')
        })
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" required autoComplete="name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-phone">Phone / WhatsApp</Label>
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-subject">Subject</Label>
          <Input id="c-subject" name="subject" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-message">Message</Label>
        <Textarea id="c-message" name="message" required rows={5} />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 self-start rounded-full bg-ink px-8 text-ink-foreground hover:bg-ink/90">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
