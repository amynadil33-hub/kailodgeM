'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function RecoveryForm({ updating }: { updating: boolean }) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setReady(true), [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setError('')

    const password = String(fields.get('password') ?? '')
    if (updating && password !== fields.get('confirmation')) {
      setError('The passwords must match.')
      return
    }

    setBusy(true)
    try {
      const supabase = createClient()
      if (updating) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          setError(error.code === 'same_password' || error.code === 'weak_password'
            ? error.message
            : 'We couldn’t change your password. Request a new reset link and try again.')
          return
        }
        await supabase.auth.signOut({ scope: 'local' })
      } else {
        const email = String(fields.get('email') ?? '').trim()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?flow=recovery`,
        })
        if (error?.status === 429) {
          setError('Too many attempts. Please wait a minute and try again.')
          return
        }
        if (error && error.code !== 'email_address_not_authorized') {
          setError('We couldn’t send a reset link right now. Please try again.')
          return
        }
      }
      setComplete(true)
    } catch {
      setError('Password recovery is unavailable right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (complete) {
    return (
      <p role="status" className="text-sm">
        {updating
          ? 'Password updated. Sign in with your new password.'
          : 'If the email belongs to a staff account, you’ll receive a reset link. Open it in this browser.'}
      </p>
    )
  }

  return (
    <form method="post" onSubmit={submit} className="flex flex-col gap-4">
      {updating ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" name="email" type="email" autoComplete="email" required disabled={!ready} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!ready || busy}>
        {busy ? 'Please wait…' : updating ? 'Save new password' : 'Send reset link'}
      </Button>
    </form>
  )
}
