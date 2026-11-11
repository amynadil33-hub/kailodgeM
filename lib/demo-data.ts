import type {
  Amenity,
  DecorationPackage,
  MediaItem,
  PhysicalRoom,
  Place,
  RoomType,
  SiteSettings,
} from './types'

/**
 * Sample data used only when Supabase is not configured.
 * Rates, room types and photos are placeholders — replace them through the admin portal.
 */

export const DEMO_SETTINGS: SiteSettings = {
  property_name: 'Kai Lodge Maldives',
  base_currency: 'USD',
  usd_to_mvr_rate: null,
  advance_percent: 50,
  payment_deadline_hours: 24,
  check_in_time: null,
  check_out_time: null,
  phone: '+960 7300036',
  whatsapp: '9607300036',
  email: null,
  address: 'M. Khaleeju, Muranga Magu, Malé, Maldives',
  map_embed_url: null,
  policies: null,
  cancellation_policy: null,
  early_late_policy:
    'Early check-in and late check-out are subject to availability and additional charges.',
}

const a = (slug: string, name: string, icon: string, scope: Amenity['scope'], sort: number): Amenity => ({
  id: `amenity-${slug}`,
  slug,
  name,
  icon,
  scope,
  description: null,
  sort,
})

export const DEMO_AMENITIES: Amenity[] = [
  a('queen-bed', 'Queen-size bed', 'bed-double', 'room', 1),
  a('smart-tv', 'Smart TV', 'tv', 'room', 2),
  a('mini-fridge', 'Mini refrigerator', 'refrigerator', 'room', 3),
  a('coffee', 'Coffee', 'coffee', 'room', 4),
  a('hot-cold-water', 'Hot & cold water', 'droplets', 'room', 5),
  a('towels', 'Towels', 'bath', 'room', 6),
  a('blankets', 'Blankets', 'layers', 'room', 7),
  a('safe', 'Safe locker', 'lock', 'room', 8),
  a('hair-dryer', 'Hair dryer', 'wind', 'room', 9),
  a('mirror', 'Dressing mirror', 'scan-face', 'room', 10),
  a('emergency-light', 'Emergency light', 'lightbulb', 'room', 11),
  a('recliner', 'Recliner', 'armchair', 'room', 12),
  a('foot-massager', 'Foot massager', 'footprints', 'room', 13),
  a('balcony', 'Balcony', 'door-open', 'room', 14),
  a('city-view', 'City view', 'building-2', 'room', 15),
  a('wifi', 'Complimentary Wi-Fi', 'wifi', 'property', 20),
  a('kitchen', 'Equipped kitchen', 'cooking-pot', 'property', 21),
  a('microwave', 'Microwave', 'microwave', 'property', 22),
  a('rice-cooker', 'Rice cooker', 'soup', 'property', 23),
  a('egg-boiler', 'Egg boiler', 'egg', 'property', 24),
  a('washing-machine', 'Washing machine', 'washing-machine', 'property', 25),
  a('iron', 'Iron & ironing board', 'shirt', 'property', 26),
  a('access-24-7', '24/7 property access', 'key-round', 'property', 27),
]

const CORE = [
  'queen-bed',
  'smart-tv',
  'mini-fridge',
  'coffee',
  'hot-cold-water',
  'towels',
  'blankets',
  'safe',
  'hair-dryer',
  'mirror',
  'emergency-light',
].map((s) => `amenity-${s}`)

const img = (
  id: string,
  url: string,
  alt: string,
  category: MediaItem['category'],
  room_type_id: string | null = null,
  sort = 0,
  caption: string | null = null,
): MediaItem => ({ id, url, alt, category, room_type_id, sort, caption })

export const DEMO_MEDIA: MediaItem[] = [
  img('m1', '/images/room-queen-1.png', 'Queen room with white linen and soft bedside lighting', 'room', 'rt-queen', 1),
  img('m2', '/images/room-queen-2.png', 'In-room coffee, kettle, mini refrigerator and safe locker', 'room', 'rt-queen', 2),
  img('m3', '/images/room-family-1.png', 'Bright room with fresh towels laid out', 'room', 'rt-queen', 3),
  img('m4', '/images/room-balcony-1.png', 'Room opening onto a balcony above the rooftops of Malé', 'room', 'rt-balcony', 1),
  img('m5', '/images/room-balcony-2.png', 'Balcony seating overlooking the city at dusk', 'room', 'rt-balcony', 2),
  img('m6', '/images/room-recliner-1.png', 'Room with a recliner, foot massager and Smart TV', 'room', 'rt-recliner', 1),
  img('m7', '/images/room-queen-2.png', 'Coffee and tea tray with kettle', 'room', 'rt-recliner', 2),
  img('m8', '/images/property-entrance.png', 'Warm, welcoming entrance lobby', 'property', null, 1),
  img('m9', '/images/property-kitchen.png', 'Shared guest kitchen with microwave and rice cooker', 'property', null, 2),
  img('m10', '/images/property-laundry.png', 'Guest laundry with washing machine and iron', 'property', null, 3),
  img('m11', '/images/decor-birthday.png', 'Birthday room setup with balloons and cake', 'occasion', null, 1),
  img('m12', '/images/decor-romantic.png', 'Romantic setup with rose petals and candles', 'occasion', null, 2),
  img('m13', '/images/male-waterfront.png', 'Dhoni boats on the Malé waterfront at sunset', 'neighbourhood', null, 1),
  img('m14', '/images/male-cafe.png', 'Evening at a local café in Malé', 'neighbourhood', null, 2),
  img('m15', '/images/male-beach.png', 'Swimmers at the city beach in Malé', 'neighbourhood', null, 3),
  img('m16', '/images/male-neighbourhood.png', 'Morning in a residential lane in Malé', 'neighbourhood', null, 4),
  img('m17', '/images/hero-male-street.png', 'Busy street in Malé at golden hour', 'neighbourhood', null, 5),
  img('m18', '/images/hero-male-night.png', 'Malé from above at night', 'neighbourhood', null, 6),
]

const imagesFor = (id: string) => DEMO_MEDIA.filter((m) => m.room_type_id === id)

export const DEMO_ROOM_TYPES: RoomType[] = [
  {
    id: 'rt-queen',
    slug: 'queen-room',
    name: 'Queen Room',
    tagline: 'Calm, compact and everything you need.',
    description:
      'A restful room for one or two, with a queen-size bed, Smart TV and the small comforts that make city stays easy — coffee, a mini refrigerator, hot and cold water and a safe locker for your valuables.',
    base_rate: 65,
    max_adults: 2,
    max_children: 1,
    max_guests: 3,
    bed: 'Queen-size bed',
    active: true,
    sort: 1,
    amenity_ids: CORE,
    images: imagesFor('rt-queen'),
  },
  {
    id: 'rt-balcony',
    slug: 'balcony-city-view',
    name: 'Balcony City View Room',
    tagline: 'Morning coffee above the rooftops.',
    description:
      'Our room for watching Malé wake up. A private balcony and city view, plus all the essentials of the Queen Room for a comfortable night in.',
    base_rate: 80,
    max_adults: 2,
    max_children: 1,
    max_guests: 3,
    bed: 'Queen-size bed',
    active: true,
    sort: 2,
    amenity_ids: [...CORE, 'amenity-balcony', 'amenity-city-view'],
    images: imagesFor('rt-balcony'),
  },
  {
    id: 'rt-recliner',
    slug: 'recliner-comfort',
    name: 'Recliner Comfort Room',
    tagline: 'Put your feet up after a long day.',
    description:
      'Made for unwinding after flights, meetings or hospital visits — a recliner and foot massager alongside the queen-size bed, Smart TV and in-room coffee.',
    base_rate: 75,
    max_adults: 2,
    max_children: 1,
    max_guests: 3,
    bed: 'Queen-size bed',
    active: true,
    sort: 3,
    amenity_ids: [...CORE, 'amenity-recliner', 'amenity-foot-massager'],
    images: imagesFor('rt-recliner'),
  },
]

export const DEMO_ROOMS: PhysicalRoom[] = [
  { id: 'r-1', room_type_id: 'rt-queen', name: 'Sample Room A', floor: null, active: true, notes: null },
  { id: 'r-2', room_type_id: 'rt-balcony', name: 'Sample Room B', floor: null, active: true, notes: null },
  { id: 'r-3', room_type_id: 'rt-recliner', name: 'Sample Room C', floor: null, active: true, notes: null },
]

export const DEMO_PACKAGES: DecorationPackage[] = [
  {
    id: 'pk-birthday',
    slug: 'birthday',
    name: 'Birthday setup',
    description: 'Balloons, fairy lights and a celebratory room setup waiting when you arrive.',
    price: 40,
    image_url: '/images/decor-birthday.png',
    active: true,
    sort: 1,
  },
  {
    id: 'pk-anniversary',
    slug: 'anniversary',
    name: 'Anniversary setup',
    description: 'Rose petals, candles and a softly lit room for a quiet celebration together.',
    price: 50,
    image_url: '/images/decor-romantic.png',
    active: true,
    sort: 2,
  },
  {
    id: 'pk-romantic',
    slug: 'romantic',
    name: 'Romantic evening',
    description: 'Rose petals on the bed, candles and towel art — a simple, thoughtful surprise.',
    price: 35,
    image_url: '/images/decor-romantic.png',
    active: true,
    sort: 3,
  },
]

export const DEMO_PLACES: Place[] = [
  {
    id: 'p-1',
    name: 'Local cafés & short eats',
    description: 'Tea, hedhikaa and conversation in the cafés that line the surrounding streets.',
    distance: null,
    image_url: '/images/male-cafe.png',
    sort: 1,
  },
  {
    id: 'p-2',
    name: 'The waterfront',
    description: 'Watch dhonis come and go along the harbour as the sun sets over the city.',
    distance: null,
    image_url: '/images/male-waterfront.png',
    sort: 2,
  },
  {
    id: 'p-3',
    name: 'Rasfannu Beach',
    description: 'Malé’s artificial city beach — a favourite for an evening swim with locals.',
    distance: null,
    image_url: '/images/male-beach.png',
    sort: 3,
  },
  {
    id: 'p-4',
    name: 'Neighbourhood lanes',
    description: 'Corner shops, potted plants and everyday life just beyond the front door.',
    distance: null,
    image_url: '/images/male-neighbourhood.png',
    sort: 4,
  },
]
