import type { Metadata } from 'next'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from '@/components/site/contact-form'
import { PageHero } from '@/components/site/page-hero'
import { whatsappLink } from '@/lib/format'
import { getSiteData } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Call, WhatsApp or email Kai Lodge, Muranga Magu, Henveiru, Malé.',
}

export default async function ContactPage() {
  const { content, settings } = await getSiteData()
  const tel = settings.phone.replace(/[^\d+]/g, '')

  const channels = [
    { icon: MessageCircle, label: 'WhatsApp', value: settings.whatsapp, href: whatsappLink(settings.whatsapp), external: true },
    { icon: Phone, label: 'Phone', value: settings.phone, href: `tel:${tel}`, external: false },
    ...(settings.email
      ? [{ icon: Mail, label: 'Email', value: settings.email, href: `mailto:${settings.email}`, external: false }]
      : []),
  ]

  return (
    <>
      <PageHero eyebrow="Contact" title={content['contact.title']} intro={content['contact.intro']} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-center gap-4 py-5 hover:text-gold"
                >
                  <c.icon className="size-5 text-gold" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.label}</span>
                    <span className="text-lg">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
            <li className="flex items-start gap-4 py-5">
              <MapPin className="mt-1 size-5 text-gold" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Address</span>
                <span className="text-lg">{settings.address}</span>
              </span>
            </li>
          </ul>
          {(settings.check_in_time || settings.check_out_time) && (
            <p className="text-sm text-muted-foreground">
              Check-in from {settings.check_in_time ?? '—'} · Check-out by {settings.check_out_time ?? '—'} · Reception
              by WhatsApp 24/7
            </p>
          )}
        </div>
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </>
  )
}
