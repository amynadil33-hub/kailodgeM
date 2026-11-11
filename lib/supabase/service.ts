import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let service: SupabaseClient | undefined

/**
 * Service-role client. Bypasses RLS, so it is only used server-side for guest flows
 * (availability, creating bookings, token-scoped booking access). Never import from client code.
 */
export function createServiceClient() {
  if (service) return service
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role is not configured')
  service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return service
}
