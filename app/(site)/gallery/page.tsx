import type { Metadata } from 'next'
import { PageHero } from '@/components/site/page-hero'
import { PhotoGallery } from '@/components/site/photo-gallery'
import { getSiteData } from '@/lib/data'
import type { MediaItem } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos of the rooms, shared spaces, occasions and neighbourhood at Kai Lodge, Malé.',
}

const SECTIONS: { category: MediaItem['category']; title: string }[] = [
  { category: 'room', title: 'Rooms' },
  { category: 'property', title: 'The lodge' },
  { category: 'occasion', title: 'Occasions' },
  { category: 'neighbourhood', title: 'Around Malé' },
]

export default async function GalleryPage() {
  const { content, media, roomTypes } = await getSiteData()
  const roomImages = roomTypes.flatMap((r) => r.images)
  const all = [...media, ...roomImages.filter((ri) => !media.some((m) => m.id === ri.id))]

  return (
    <>
      <PageHero eyebrow="Gallery" title={content['gallery.title']} intro={content['gallery.intro']} />
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-20 md:px-8">
        {SECTIONS.map((s) => {
          const items = all.filter((m) => m.category === s.category).sort((a, b) => a.sort - b.sort)
          if (items.length === 0) return null
          return (
            <section key={s.category} className="flex flex-col gap-6" aria-labelledby={`g-${s.category}`}>
              <h2 id={`g-${s.category}`} className="text-3xl">
                {s.title}
              </h2>
              <PhotoGallery items={items} layout="grid" />
            </section>
          )
        })}
      </div>
    </>
  )
}
