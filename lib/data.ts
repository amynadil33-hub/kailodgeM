import 'server-only'
import { cache } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { contentDefaults, type SiteContent } from './content-schema'
import {
  DEMO_AMENITIES,
  DEMO_MEDIA,
  DEMO_PACKAGES,
  DEMO_PLACES,
  DEMO_ROOM_TYPES,
  DEMO_SETTINGS,
} from './demo-data'
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'
import type {
  Amenity,
  DecorationPackage,
  Fee,
  MediaItem,
  Place,
  RatePeriod,
  RoomType,
  SiteSettings,
} from './types'

export interface SiteData {
  demo: boolean
  settings: SiteSettings
  content: SiteContent
  roomTypes: RoomType[]
  amenities: Amenity[]
  packages: DecorationPackage[]
  places: Place[]
  media: MediaItem[]
  fees: Fee[]
  ratePeriods: RatePeriod[]
}

function publicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function demoData(): SiteData {
  return {
    demo: true,
    settings: DEMO_SETTINGS,
    content: contentDefaults(),
    roomTypes: DEMO_ROOM_TYPES,
    amenities: DEMO_AMENITIES,
    packages: DEMO_PACKAGES,
    places: DEMO_PLACES,
    media: DEMO_MEDIA,
    fees: [],
    ratePeriods: [],
  }
}

/** Loads all public website data once per request. Falls back to labelled demo data. */
export const getSiteData = cache(async (): Promise<SiteData> => {
  if (!isSupabaseConfigured()) return demoData()

  const sb = publicClient()
  const [settings, content, types, rta, amenities, packages, places, media, fees, rates] = await Promise.all([
    sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    sb.from('site_content').select('key, value'),
    sb.from('room_types').select('*').eq('active', true).order('sort'),
    sb.from('room_type_amenities').select('room_type_id, amenity_id'),
    sb.from('amenities').select('*').order('sort'),
    sb.from('packages').select('*').eq('active', true).order('sort'),
    sb.from('places').select('*').order('sort'),
    sb.from('media').select('*').order('sort'),
    sb.from('fees').select('*').eq('active', true).order('sort'),
    sb.from('rate_periods').select('*'),
  ])

  if (settings.error || types.error) {
    console.error('[kai-lodge] Failed to load site data, using demo content', settings.error ?? types.error)
    return demoData()
  }

  const mediaItems = (media.data ?? []) as MediaItem[]
  const links = (rta.data ?? []) as { room_type_id: string; amenity_id: string }[]
  const roomTypes = ((types.data ?? []) as Omit<RoomType, 'amenity_ids' | 'images'>[]).map((t) => ({
    ...t,
    base_rate: Number(t.base_rate),
    amenity_ids: links.filter((l) => l.room_type_id === t.id).map((l) => l.amenity_id),
    images: mediaItems.filter((m) => m.room_type_id === t.id),
  }))

  const storedContent = Object.fromEntries(
    ((content.data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]),
  )

  return {
    demo: false,
    settings: { ...DEMO_SETTINGS, ...(settings.data ?? {}) } as SiteSettings,
    content: { ...contentDefaults(), ...storedContent },
    roomTypes,
    amenities: (amenities.data ?? []) as Amenity[],
    packages: ((packages.data ?? []) as DecorationPackage[]).map((p) => ({
      ...p,
      price: p.price === null ? null : Number(p.price),
    })),
    places: (places.data ?? []) as Place[],
    media: mediaItems,
    fees: ((fees.data ?? []) as Fee[]).map((f) => ({ ...f, amount: Number(f.amount) })),
    ratePeriods: (rates.data ?? []) as RatePeriod[],
  }
})
