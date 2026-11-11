import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ContentEditor } from '@/components/admin/content-editor'
import { requireAdmin } from '@/lib/admin/auth'
import { CONTENT_FIELDS } from '@/lib/content-schema'

export const metadata = { title: 'Page content' }

export default async function ContentPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('site_content').select('key, value')
  const values = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))

  return (
    <>
      <AdminPageHeader
        title="Page content"
        description="Headlines, text and hero images across the website. Changes go live as soon as you publish."
      />
      <ContentEditor fields={CONTENT_FIELDS} values={values} />
    </>
  )
}
