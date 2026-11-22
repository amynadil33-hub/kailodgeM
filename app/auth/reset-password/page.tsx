import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RecoveryForm } from '@/components/admin/recovery-form'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Reset staff password', robots: { index: false, follow: false } }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; expired?: string }>
}) {
  if (!isSupabaseConfigured()) redirect('/admin/login')

  const { verified, expired } = await searchParams
  const updating = verified === '1'
  if (updating) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/reset-password?expired=1')
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-ink px-4 py-12 text-ink-foreground">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-xl bg-card p-6 text-card-foreground shadow-xl">
        <h1 className="font-serif text-2xl">{updating ? 'Set a new password' : 'Reset your staff password'}</h1>
        {expired === '1' && !updating && (
          <p role="alert" className="text-sm text-destructive">
            This reset link couldn’t be opened. Request a new link and open it in this browser.
          </p>
        )}
        <RecoveryForm updating={updating} />
        <Link href="/admin/login" className="text-center text-sm text-muted-foreground hover:underline">
          Back to staff sign-in
        </Link>
      </div>
    </main>
  )
}
