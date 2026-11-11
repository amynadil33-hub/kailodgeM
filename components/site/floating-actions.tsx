'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'

export function FloatingActions({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname()
  const inBooking = pathname.startsWith('/book')

  return (
    <>
      <a
        href={whatsappLink(whatsapp, 'Hello Kai Lodge, I would like to ask about a stay.')}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-ink shadow-lg shadow-ink/25 transition-transform hover:scale-105 md:right-6 md:bottom-6',
          inBooking ? 'bottom-4' : 'bottom-20',
        )}
      >
        <MessageCircle className="size-6" aria-hidden="true" />
        <span className="sr-only">Chat with Kai Lodge on WhatsApp</span>
      </a>

      {!inBooking && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-foreground/10 bg-ink/95 p-3 backdrop-blur md:hidden">
          <Link
            href="/book"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-semibold text-ink"
          >
            Check availability
          </Link>
        </div>
      )}
    </>
  )
}
