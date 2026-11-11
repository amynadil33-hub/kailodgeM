import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/login-form'
import { SignOutButton } from '@/components/admin/sign-out-button'
import { getAdminSession } from '@/lib/admin/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Staff sign in', robots: { index: false, follow: false } }

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const params = await searchParams
  const next = params.next?.startsWith('/admin') && !params.next.startsWith('//') ? params.next : '/admin'
  const configured = isSupabaseConfigured()

  let signedInWithoutAccess: string | null = null
  if (configured) {
    if (await getAdminSession()) redirect(next)
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    signedInWithoutAccess = data.user?.email ?? null
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-ink px-4 py-12 text-ink-foreground">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link href="/" className="mx-auto" aria-label="Kai Lodge Maldives home">
          <Image src="/images/kai-lodge-logo.jpg" alt="Kai Lodge" width={140} height={140} className="rounded-md" priority />
        </Link>
        <div className="flex flex-col gap-6 rounded-xl bg-card p-6 text-card-foreground shadow-xl">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="font-serif text-2xl">Staff portal</h1>
            <p className="text-sm text-muted-foreground">Reservations, rooms and website content.</p>
          </div>

          {!configured ? (
            <div className="flex flex-col gap-2 rounded-md bg-muted p-4 text-sm leading-relaxed">
              <p className="font-medium">Supabase is not connected yet.</p>
              <p className="text-muted-foreground">
                Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
                <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>, run the migrations, then sign in here.
              </p>
            </div>
          ) : signedInWithoutAccess ? (
            <div className="flex flex-col gap-3 text-sm leading-relaxed">
              <p>
                You are signed in as <strong>{signedInWithoutAccess}</strong>, but this account has not been given staff access
                yet. Ask an owner to add you under Settings → Team.
              </p>
              <SignOutButton />
            </div>
          ) : (
            <LoginForm next={next} />
          )}
        </div>
        <Link href="/" className="text-center text-sm text-ink-foreground/70 hover:text-ink-foreground">
          ← Back to website
        </Link>
      </div>
    </main>
  )
}
