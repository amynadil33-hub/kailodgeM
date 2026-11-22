export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** True when the public Supabase credentials exist. Without them the site runs in labelled demo mode. */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY)
}

export function getSupabaseServerKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function hasServiceRole() {
  return isSupabaseConfigured() && Boolean(getSupabaseServerKey())
}

export function isLiveMode() {
  return hasServiceRole()
}
