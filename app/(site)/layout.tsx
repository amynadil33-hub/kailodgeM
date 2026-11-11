import { DemoBanner } from '@/components/site/demo-banner'
import { FloatingActions } from '@/components/site/floating-actions'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { getSiteData } from '@/lib/data'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { demo, settings } = await getSiteData()
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      {demo && <DemoBanner />}
      <SiteHeader phone={settings.phone} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <FloatingActions whatsapp={settings.whatsapp} />
    </div>
  )
}
