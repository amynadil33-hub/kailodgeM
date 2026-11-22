import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const recovery = request.nextUrl.searchParams.get('flow') === 'recovery'
  const next = request.nextUrl.searchParams.get('next')
  let location = recovery ? '/auth/reset-password?expired=1' : '/admin/login?confirmation=failed'

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      location = recovery ? '/auth/reset-password?verified=1' : '/admin/login'
      if (!recovery && next && next.startsWith('/admin')) {
        location += `?${new URLSearchParams({ next })}`
      }
    }
  }

  return new NextResponse(null, { status: 303, headers: { location } })
}
