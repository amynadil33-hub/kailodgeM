import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/env'

let client: SupabaseClient | undefined

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    { cookieOptions: { secure: process.env.NODE_ENV === 'production' } },
  )
  return client
}
