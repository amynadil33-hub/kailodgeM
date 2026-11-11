import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/format'
import { RuleDot } from './rule-dot'

export function BookingCta({ title, body, whatsapp }: { title: string; body: string; whatsapp: string }) {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
        <h2 className="text-4xl text-balance md:text-5xl">{title}</h2>
        <RuleDot />
        <p className="max-w-xl text-lg leading-relaxed text-ink-foreground/75 text-pretty">{body}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/book"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft"
          >
            Check availability
          </Link>
          <a
            href={whatsappLink(whatsapp, 'Hello Kai Lodge, I would like to plan a stay.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink-foreground/25 px-8 text-sm font-semibold transition-colors hover:border-gold-soft"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Message on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
