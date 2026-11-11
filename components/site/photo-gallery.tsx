'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { MediaItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PhotoGallery({ items, layout = 'mosaic' }: { items: MediaItem[]; layout?: 'mosaic' | 'grid' }) {
  const [index, setIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const open = (i: number) => {
    setIndex(i)
    dialogRef.current?.showModal()
  }
  const close = useCallback(() => dialogRef.current?.close(), [])
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)),
    [items.length],
  )

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const onClose = () => setIndex(null)
    el.addEventListener('keydown', onKey)
    el.addEventListener('close', onClose)
    return () => {
      el.removeEventListener('keydown', onKey)
      el.removeEventListener('close', onClose)
    }
  }, [step])

  if (items.length === 0) return null
  const current = index === null ? null : items[index]

  return (
    <>
      <ul className={cn('grid gap-3', layout === 'mosaic' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3')}>
        {items.map((m, i) => (
          <li
            key={m.id}
            className={cn(layout === 'mosaic' && i === 0 && 'col-span-2 row-span-2', 'relative overflow-hidden rounded-lg bg-muted')}
          >
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block aspect-square w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <Image
                src={m.url}
                alt={m.alt}
                fill
                sizes={layout === 'mosaic' && i === 0 ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="sr-only">Open photo: {m.alt}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-ink-foreground backdrop:bg-ink/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-ink-foreground/70">
                {(index ?? 0) + 1} / {items.length}
              </p>
              <button type="button" onClick={close} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-ink-foreground/10">
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="relative flex-1">
              <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <button type="button" onClick={() => step(-1)} className="inline-flex size-11 items-center justify-center rounded-full border border-ink-foreground/20 hover:border-gold-soft">
                <ChevronLeft className="size-5" aria-hidden="true" />
                <span className="sr-only">Previous photo</span>
              </button>
              <p className="text-center text-sm text-ink-foreground/80 text-pretty">{current.caption ?? current.alt}</p>
              <button type="button" onClick={() => step(1)} className="inline-flex size-11 items-center justify-center rounded-full border border-ink-foreground/20 hover:border-gold-soft">
                <ChevronRight className="size-5" aria-hidden="true" />
                <span className="sr-only">Next photo</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
