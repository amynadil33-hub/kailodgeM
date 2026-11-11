import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EnquiryStatusButtons } from '@/components/admin/quick-actions'
import { StatusPill } from '@/components/admin/status-pill'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Enquiries' }

export default async function EnquiriesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('enquiries')
    .select('id, name, email, phone, subject, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <>
      <AdminPageHeader title="Enquiries" description="Messages sent from the website contact form." />
      {!data?.length ? (
        <p className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No enquiries yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((e) => {
            const digits = e.phone?.replace(/\D/g, '')
            return (
              <li key={e.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex-1 font-medium">
                    {e.name} {e.subject ? <span className="font-normal text-muted-foreground">— {e.subject}</span> : null}
                  </p>
                  <StatusPill value={e.status} tones={{ new: 'gold', replied: 'good', closed: 'neutral' }} />
                </div>
                <p className="whitespace-pre-line leading-relaxed">{e.message}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span>{formatDateTime(e.created_at)}</span>
                  {e.email ? (
                    <a href={`mailto:${e.email}`} className="hover:text-foreground">
                      {e.email}
                    </a>
                  ) : null}
                  {digits ? (
                    <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      WhatsApp {e.phone}
                    </a>
                  ) : null}
                </div>
                <EnquiryStatusButtons id={e.id} status={e.status} />
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
