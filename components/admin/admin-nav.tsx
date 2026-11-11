'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BedDouble,
  CalendarRange,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  Inbox,
  LayoutDashboard,
  Images,
  MapPin,
  Menu,
  Percent,
  Receipt,
  Settings,
  Sparkles,
  Tag,
  Users,
  Wallet,
  X,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from './sign-out-button'

const GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/reservations', label: 'Reservations', icon: ClipboardList },
      { href: '/admin/calendar', label: 'Room calendar', icon: CalendarRange },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/requests', label: 'Extras & quotes', icon: Sparkles },
      { href: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Property',
    items: [
      { href: '/admin/manage/room_types', label: 'Room types', icon: BedDouble },
      { href: '/admin/manage/rooms', label: 'Rooms', icon: Building2 },
      { href: '/admin/manage/rate_periods', label: 'Seasonal rates', icon: Tag },
      { href: '/admin/manage/amenities', label: 'Amenities', icon: Sparkles },
      { href: '/admin/manage/packages', label: 'Decor packages', icon: Gift },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/manage/discounts', label: 'Offers', icon: Percent },
      { href: '/admin/manage/fees', label: 'Fees & taxes', icon: Receipt },
      { href: '/admin/manage/bank_accounts', label: 'Bank accounts', icon: Wallet },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/content', label: 'Page content', icon: FileText },
      { href: '/admin/manage/media', label: 'Photographs', icon: Images },
      { href: '/admin/manage/places', label: 'Neighbourhood', icon: MapPin },
      { href: '/admin/settings', label: 'Settings & team', icon: Settings },
    ],
  },
]

export function AdminNav({ email, badges }: { email: string; badges: Record<string, number> }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium tracking-widest text-gold uppercase">{group.label}</p>
          <ul className="flex flex-col">
            {group.items.map((item) => {
              const Icon = item.icon
              const count = badges[item.href] ?? 0
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-foreground/75 transition-colors hover:bg-ink-foreground/10 hover:text-ink-foreground',
                      isActive(item.href) && 'bg-ink-foreground/10 text-ink-foreground',
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 ? (
                      <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-ink">
                        {count}
                        <span className="sr-only"> need attention</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const footer = (
    <div className="flex flex-col gap-2 border-t border-ink-foreground/15 pt-4">
      <p className="truncate px-3 text-xs text-ink-foreground/60">{email}</p>
      <Link href="/" target="_blank" className="px-3 text-sm text-ink-foreground/75 hover:text-ink-foreground">
        View website ↗
      </Link>
      <SignOutButton compact />
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-ink-foreground lg:hidden">
        <Link href="/admin" className="font-serif text-lg">
          Kai Lodge <span className="text-gold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="rounded-md p-2 hover:bg-ink-foreground/10"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>
      {open ? (
        <div id="admin-mobile-nav" className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col gap-6 overflow-y-auto bg-ink p-4 text-ink-foreground lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 overflow-y-auto bg-ink p-4 text-ink-foreground lg:flex">
        <Link href="/admin" className="px-3 pt-2 font-serif text-xl">
          Kai Lodge <span className="text-gold">Admin</span>
        </Link>
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>
    </>
  )
}
