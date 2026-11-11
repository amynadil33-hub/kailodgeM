import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { whatsappLink } from '@/lib/format'
import type { SiteSettings } from '@/lib/types'
import { RuleDot } from './rule-dot'
import { NAV_LINKS } from '@/lib/nav'

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-ink pb-24 text-ink-foreground lg:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 md:px-8 lg:flex-row lg:justify-between">
        <div className="flex max-w-sm flex-col gap-5">
          <Image src="/images/kai-lodge-logo.jpg" alt="Kai Lodge — Holiday Home Rentals" width={140} height={140} />
          <p className="font-serif text-2xl text-balance">A stay shaped around you.</p>
          <RuleDot align="start" />
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">Explore</p>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-foreground/75 hover:text-ink-foreground">
              {l.label}
            </Link>
          ))}
          <Link href="/book" className="text-ink-foreground/75 hover:text-ink-foreground">
            Book your stay
          </Link>
        </nav>

        <address className="flex max-w-xs flex-col gap-4 text-sm not-italic">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">Find us</p>
          <p className="flex gap-3 leading-relaxed text-ink-foreground/80">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
            {settings.address}
          </p>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex gap-3 text-ink-foreground/80 hover:text-ink-foreground">
            <Phone className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
            {settings.phone}
          </a>
          <a
            href={whatsappLink(settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 text-ink-foreground/80 hover:text-ink-foreground"
          >
            <MessageCircle className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
            WhatsApp us
          </a>
        </address>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-foreground/55 md:flex-row md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Kai Lodge Maldives. Muranga Magu, Malé.</p>
          <Link href="/admin" className="hover:text-ink-foreground">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  )
}
