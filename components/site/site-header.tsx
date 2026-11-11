'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/utils'

import { NAV_LINKS } from '@/lib/nav'

export function SiteHeader({ phone }: { phone: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-ink-foreground/10 bg-ink text-ink-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:h-20 md:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Kai Lodge Maldives — home">
          <Image
            src="/images/kai-lodge-logo.jpg"
            alt=""
            width={64}
            height={64}
            priority
            className="size-12 md:size-16"
          />
          <span className="hidden font-serif text-lg tracking-[0.2em] sm:inline">
            KAI <span className="text-gold-soft">LODGE</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative py-2 text-ink-foreground/75 transition-colors hover:text-ink-foreground',
                      active && 'text-ink-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold',
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="hidden items-center gap-2 text-sm text-ink-foreground/75 hover:text-ink-foreground xl:flex"
          >
            <Phone className="size-4" aria-hidden="true" />
            {phone}
          </a>
          <Link
            href="/book"
            className="hidden h-10 items-center rounded-full bg-gold px-5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft sm:inline-flex"
          >
            Book your stay
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink-foreground lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-ink px-6 pt-6 pb-28 md:top-20 lg:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            <li>
              <Link href="/" className="block border-b border-ink-foreground/10 py-4 font-serif text-2xl">
                Home
              </Link>
            </li>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? 'page' : undefined}
                  className="block border-b border-ink-foreground/10 py-4 font-serif text-2xl aria-[current=page]:text-gold-soft"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-8 flex items-center gap-2 text-ink-foreground/80">
          <Phone className="size-4" aria-hidden="true" /> {phone}
        </a>
      </div>
    </header>
  )
}
