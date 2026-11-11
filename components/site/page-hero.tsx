import Image from 'next/image'
import { Eyebrow, RuleDot } from './rule-dot'

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt = '',
}: {
  eyebrow?: string
  title: string
  intro?: string
  image?: string
  imageAlt?: string
}) {
  if (!image) {
    return (
      <section className="bg-ink text-ink-foreground">
        <div className="reveal mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-20 text-center md:py-28">
          {eyebrow && <Eyebrow className="text-gold-soft">{eyebrow}</Eyebrow>}
          <h1 className="text-4xl text-balance md:text-6xl">{title}</h1>
          <RuleDot />
          {intro && <p className="max-w-2xl text-lg leading-relaxed text-ink-foreground/75 text-pretty">{intro}</p>}
        </div>
      </section>
    )
  }

  return (
    <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover opacity-55" />
      <div className="absolute inset-0 -z-10 bg-ink/45" aria-hidden="true" />
      <div className="reveal mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-24 text-center md:py-36">
        {eyebrow && <Eyebrow className="text-gold-soft">{eyebrow}</Eyebrow>}
        <h1 className="text-4xl text-balance md:text-6xl">{title}</h1>
        <RuleDot />
        {intro && <p className="max-w-2xl text-lg leading-relaxed text-ink-foreground/85 text-pretty">{intro}</p>}
      </div>
    </section>
  )
}
