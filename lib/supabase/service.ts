import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServerKey, SUPABASE_URL } from '@/lib/env'

let service: SupabaseClient | undefined

/**
 * Service-role client. Bypasses RLS, so it is only used server-side for guest flows
 * (availability, creating bookings, token-scoped booking access). Never import from client code.
 */
export function createServiceClient() {
  if (service) return service
  const key = getSupabaseServerKey()
  if (!SUPABASE_URL || !key) throw new Error('Supabase server key is not configured')
  service = createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return service
}
