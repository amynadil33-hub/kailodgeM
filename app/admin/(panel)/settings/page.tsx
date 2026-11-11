import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { SettingsForm } from '@/components/admin/content-editor'
import { TeamManager } from '@/components/admin/team-manager'
import { getSettingsFields } from '@/app/actions/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { hasServiceRole } from '@/lib/env'

export const metadata = { title: 'Settings & team' }

export default async function SettingsPage() {
  const session = await requireAdmin()
  const { supabase } = session
  const [fields, { data: settings }, { data: team }] = await Promise.all([
    getSettingsFields(),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('admin_users').select('user_id, role').order('created_at'),
  ])

  const emails = new Map<string, string>()
  if (hasServiceRole() && team?.length) {
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    await Promise.all(
      team.map(async (m) => {
        const { data } = await service.auth.admin.getUserById(m.user_id)
        if (data.user?.email) emails.set(m.user_id, data.user.email)
      }),
    )
  }
  const members = (team ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    email: emails.get(m.user_id) ?? (m.user_id === session.userId ? session.email : `${m.user_id.slice(0, 8)}…`),
  }))

  return (
    <>
      <AdminPageHeader title="Settings & team" description="Contact details, check-in times, booking policy and staff access." />
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3" aria-labelledby="property">
          <h2 id="property" className="font-serif text-xl">
            Property & booking policy
          </h2>
          <SettingsForm fields={fields} values={(settings ?? {}) as Record<string, unknown>} />
        </section>
        <section className="flex flex-col gap-3" aria-labelledby="team">
          <h2 id="team" className="font-serif text-xl">
            Team
          </h2>
          <TeamManager members={members} currentUserId={session.userId} isOwner={session.role === 'owner'} />
        </section>
      </div>
    </>
  )
}
