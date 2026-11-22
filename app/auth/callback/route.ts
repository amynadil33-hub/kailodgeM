import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/admin'
  const next = requestedNext.startsWith('/admin') && !requestedNext.startsWith('//') ? requestedNext : '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }
  }

  const login = request.nextUrl.clone()
  login.pathname = '/admin/login'
  login.search = ''
  login.searchParams.set('error', 'confirmation')
  return NextResponse.redirect(login)
}
