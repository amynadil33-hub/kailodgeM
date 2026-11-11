export type Currency = 'MVR' | 'USD'

export type AmenityScope = 'room' | 'property'

export interface Amenity {
  id: string
  slug: string
  name: string
  icon: string
  scope: AmenityScope
  description: string | null
  sort: number
}

export interface MediaItem {
  id: string
  url: string
  alt: string
  caption: string | null
  category: 'room' | 'property' | 'occasion' | 'neighbourhood'
  room_type_id: string | null
  sort: number
}

export interface RoomType {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  base_rate: number
  max_adults: number
  max_children: number
  max_guests: number
  bed: string | null
  active: boolean
  sort: number
  amenity_ids: string[]
  images: MediaItem[]
}

export interface PhysicalRoom {
  id: string
  room_type_id: string
  name: string
  floor: string | null
  active: boolean
  notes: string | null
}

export interface RatePeriod {
  id: string
  room_type_id: string
  starts_on: string
  ends_on: string
  nightly_rate: number
  label: string | null
}

export type FeeKind = 'percent' | 'per_night' | 'per_stay'

export interface Fee {
  id: string
  name: string
  kind: FeeKind
  amount: number
  active: boolean
  sort: number
}

export interface DecorationPackage {
  id: string
  slug: string
  name: string
  description: string | null
  price: number | null
  image_url: string | null
  active: boolean
  sort: number
}

export interface Discount {
  id: string
  code: string
  name: string
  kind: 'percent' | 'fixed'
  value: number
  valid_from: string | null
  valid_to: string | null
  usage_limit: number | null
  used_count: number
  min_nights: number
  active: boolean
}

export interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  currency: string | null
  swift: string | null
  notes: string | null
  active: boolean
  sort: number
}

export interface SiteSettings {
  property_name: string
  base_currency: Currency
  usd_to_mvr_rate: number | null
  advance_percent: number
  payment_deadline_hours: number
  check_in_time: string | null
  check_out_time: string | null
  phone: string
  whatsapp: string
  email: string | null
  address: string
  map_embed_url: string | null
  policies: string | null
  cancellation_policy: string | null
  early_late_policy: string | null
}

export interface Place {
  id: string
  name: string
  description: string | null
  distance: string | null
  image_url: string | null
  sort: number
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'expired'
  | 'no_show'

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting_verification'
  | 'partially_paid'
  | 'advance_paid'
  | 'paid'
  | 'refunded'

export type BookingSource = 'website' | 'whatsapp' | 'walk_in' | 'phone' | 'admin'

export type RequestKind =
  | 'package'
  | 'custom_decoration'
  | 'airport_transfer'
  | 'early_check_in'
  | 'late_check_out'
  | 'extended_stay'
  | 'other'

export type RequestStatus =
  | 'included'
  | 'quote_pending'
  | 'quoted'
  | 'accepted'
  | 'declined'
  | 'fulfilled'
  | 'cancelled'

export interface QuoteLine {
  label: string
  amount: number
  kind: 'room' | 'discount' | 'extra' | 'fee'
}

export interface Quote {
  currency: Currency
  nights: number
  nightly: { date: string; rate: number }[]
  room_subtotal: number
  discount_total: number
  extras_total: number
  fees_total: number
  grand_total: number
  advance_percent: number
  advance_amount: number
  balance_amount: number
  lines: QuoteLine[]
}
