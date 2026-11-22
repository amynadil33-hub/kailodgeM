import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { hasServiceRole, isSupabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type AdminRole = 'owner' | 'admin' | 'staff'

export interface AdminSession {
  userId: string
  email: string
  role: AdminRole
  supabase: Awaited<ReturnType<typeof createClient>>
}

export const DEFAULT_OWNER_EMAIL = 'kailodgemv@gmail.com'

function bootstrapOwnerEmails() {
  return (process.env.ADMIN_OWNER_EMAILS?.trim() || DEFAULT_OWNER_EMAIL)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Resolves the signed-in staff member, or null. Owners listed in ADMIN_OWNER_EMAILS are granted
 * access on first sign-in once their email is confirmed, so no manual SQL is needed to bootstrap.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row, error: roleError } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (roleError) return null
  let role = (row?.role as AdminRole | undefined) ?? null

  const email = (user.email ?? '').toLowerCase()
  if (!role && user.email_confirmed_at && hasServiceRole() && bootstrapOwnerEmails().includes(email)) {
    const service = createServiceClient()
    const { data: created, error } = await service
      .from('admin_users')
      .upsert({ user_id: user.id, role: 'owner' }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('role')
      .maybeSingle()
    if (!error) {
      // A concurrent request may have created the row first. Preserve the role it wrote.
      const existing = created ?? (await service.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()).data
      role = (existing?.role as AdminRole | undefined) ?? null
    }
  }

  if (!role) return null
  return { userId: user.id, email, role, supabase }
})

/** Server-side gate for every admin page and action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?denied=1')
  return session
}

export class AdminActionError extends Error {}

/** For server actions: returns the session or throws a handled error instead of redirecting. */
export async function adminForAction(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) throw new AdminActionError('Your session has ended. Please sign in again.')
  return session
}
