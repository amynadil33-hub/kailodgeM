'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const supabase = createClient()
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          const code = (error as { code?: string }).code
          if (code === 'email_not_confirmed') setMessage({ ok: false, text: 'Please confirm your email first — check your inbox.' })
          else if (error.status === 429) setMessage({ ok: false, text: 'Too many attempts. Please wait a minute and try again.' })
          else if (error.status && error.status >= 500) setMessage({ ok: false, text: 'Sign-in is unavailable right now. Please try again.' })
          else setMessage({ ok: false, text: 'Invalid email or password.' })
          return
        }
        router.replace(next)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback?next=/admin`,
          },
        })
        if (error) {
          const code = (error as { code?: string }).code
          if (code === 'weak_password') setMessage({ ok: false, text: 'Choose a stronger password (at least 8 characters).' })
          else if (error.status === 429) setMessage({ ok: false, text: 'Too many attempts. Please wait a minute and try again.' })
          else setMessage({ ok: false, text: 'We could not create the account. Please try again.' })
          return
        }
        setMessage({
          ok: true,
          text: 'Check your inbox to confirm your email. Once confirmed, an owner can grant you access.',
        })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {message ? (
        <p role="status" aria-live="polite" className={message.ok ? 'text-sm text-emerald-700' : 'text-sm text-destructive'}>
          {message.text}
        </p>
      ) : null}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create staff account'}
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setMessage(null)
        }}
      >
        {mode === 'sign-in' ? 'New team member? Create an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  )
}
