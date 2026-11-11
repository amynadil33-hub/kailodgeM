export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'image' | 'slug' | 'code'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
  /** Options loaded at runtime from another table (rendered as a select). */
  ref?: 'room_types'
  min?: number
  max?: number
  step?: string
  help?: string
  placeholder?: string
  wide?: boolean
}

export interface ResourceDef {
  table: string
  singular: string
  fields: FieldDef[]
  order: { column: string; ascending: boolean }[]
}

const SORT: FieldDef = { name: 'sort', label: 'Display order', type: 'number', min: 0, max: 10000, step: '1' }
const ACTIVE: FieldDef = { name: 'active', label: 'Active', type: 'boolean' }

export const RESOURCES = {
  room_types: {
    table: 'room_types',
    singular: 'room type',
    order: [{ column: 'sort', ascending: true }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, help: 'Lowercase letters, numbers and dashes.' },
      { name: 'tagline', label: 'Tagline', type: 'text', wide: true },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      { name: 'base_rate', label: 'Base nightly rate', type: 'number', required: true, min: 0, max: 1000000, step: '0.01' },
      { name: 'bed', label: 'Bed', type: 'text', placeholder: 'Queen-size bed' },
      { name: 'max_adults', label: 'Max adults', type: 'number', required: true, min: 1, max: 20, step: '1' },
      { name: 'max_children', label: 'Max children', type: 'number', required: true, min: 0, max: 20, step: '1' },
      { name: 'max_guests', label: 'Max guests in total', type: 'number', required: true, min: 1, max: 30, step: '1' },
      SORT,
      ACTIVE,
    ],
  },
  rooms: {
    table: 'rooms',
    singular: 'room',
    order: [{ column: 'name', ascending: true }],
    fields: [
      { name: 'name', label: 'Room name / number', type: 'text', required: true },
      { name: 'room_type_id', label: 'Room type', type: 'select', ref: 'room_types', required: true },
      { name: 'floor', label: 'Floor', type: 'text' },
      { name: 'notes', label: 'Internal notes', type: 'textarea', wide: true },
      { ...ACTIVE, help: 'Inactive rooms are never allocated.' },
    ],
  },
  rate_periods: {
    table: 'rate_periods',
    singular: 'seasonal rate',
    order: [{ column: 'starts_on', ascending: true }],
    fields: [
      { name: 'room_type_id', label: 'Room type', type: 'select', ref: 'room_types', required: true },
      { name: 'label', label: 'Label', type: 'text', placeholder: 'Peak season' },
      { name: 'starts_on', label: 'First night', type: 'date', required: true },
      { name: 'ends_on', label: 'Last night', type: 'date', required: true },
      { name: 'nightly_rate', label: 'Nightly rate', type: 'number', required: true, min: 0, max: 1000000, step: '0.01' },
    ],
  },
  amenities: {
    table: 'amenities',
    singular: 'amenity',
    order: [
      { column: 'scope', ascending: false },
      { column: 'sort', ascending: true },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Key', type: 'slug', required: true },
      {
        name: 'scope',
        label: 'Applies to',
        type: 'select',
        required: true,
        options: [
          { value: 'room', label: 'In-room (assign per room type)' },
          { value: 'property', label: 'Shared property facility' },
        ],
      },
      {
        name: 'icon',
        label: 'Icon',
        type: 'select',
        required: true,
        options: [
          'bed', 'tv', 'fridge', 'coffee', 'droplet', 'towel', 'blanket', 'lock', 'wind', 'mirror', 'lightbulb',
          'armchair', 'footprints', 'balcony', 'building', 'wifi', 'kitchen', 'microwave', 'cooker', 'egg',
          'washing', 'iron', 'key', 'clock', 'check',
        ].map((v) => ({ value: v, label: v })),
      },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      SORT,
    ],
  },
  packages: {
    table: 'packages',
    singular: 'decoration package',
    order: [{ column: 'sort', ascending: true }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Key', type: 'slug', required: true },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      {
        name: 'price',
        label: 'Price',
        type: 'number',
        min: 0,
        max: 1000000,
        step: '0.01',
        help: 'Leave empty to make this "quote on request".',
      },
      { name: 'image_url', label: 'Photograph', type: 'image', wide: true },
      SORT,
      ACTIVE,
    ],
  },
  discounts: {
    table: 'discounts',
    singular: 'offer',
    order: [{ column: 'created_at', ascending: false }],
    fields: [
      { name: 'code', label: 'Code', type: 'code', required: true, help: 'Guests type this at checkout. 3–32 letters, numbers or dashes.' },
      { name: 'name', label: 'Description', type: 'text', required: true },
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { value: 'percent', label: 'Percentage of room total' },
          { value: 'fixed', label: 'Fixed amount' },
        ],
      },
      { name: 'value', label: 'Value', type: 'number', required: true, min: 0.01, max: 1000000, step: '0.01' },
      { name: 'valid_from', label: 'Valid from (check-in)', type: 'date' },
      { name: 'valid_to', label: 'Valid to (check-in)', type: 'date' },
      { name: 'min_nights', label: 'Minimum nights', type: 'number', required: true, min: 1, max: 365, step: '1' },
      { name: 'usage_limit', label: 'Usage limit', type: 'number', min: 1, max: 100000, step: '1', help: 'Empty for unlimited.' },
      ACTIVE,
    ],
  },
  fees: {
    table: 'fees',
    singular: 'fee or tax',
    order: [{ column: 'sort', ascending: true }],
    fields: [
      { name: 'name', label: 'Name shown to guests', type: 'text', required: true },
      {
        name: 'kind',
        label: 'Charged as',
        type: 'select',
        required: true,
        options: [
          { value: 'percent', label: 'Percentage of (room − discount + extras)' },
          { value: 'per_night', label: 'Fixed amount per night' },
          { value: 'per_stay', label: 'Fixed amount per stay' },
        ],
      },
      { name: 'amount', label: 'Amount / percentage', type: 'number', required: true, min: 0, max: 1000000, step: '0.01' },
      SORT,
      ACTIVE,
    ],
  },
  bank_accounts: {
    table: 'bank_accounts',
    singular: 'bank account',
    order: [{ column: 'sort', ascending: true }],
    fields: [
      { name: 'bank_name', label: 'Bank', type: 'text', required: true },
      { name: 'account_name', label: 'Account name', type: 'text', required: true },
      { name: 'account_number', label: 'Account number', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ value: 'MVR', label: 'MVR' }, { value: 'USD', label: 'USD' }] },
      { name: 'swift', label: 'SWIFT / BIC', type: 'text' },
      { name: 'notes', label: 'Notes for guests', type: 'textarea', wide: true },
      SORT,
      { ...ACTIVE, help: 'Only active accounts are shown to guests.' },
    ],
  },
  places: {
    table: 'places',
    singular: 'neighbourhood highlight',
    order: [{ column: 'sort', ascending: true }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'distance', label: 'Distance / walking time', type: 'text', placeholder: 'Short walk' },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      { name: 'image_url', label: 'Photograph', type: 'image', wide: true },
      SORT,
    ],
  },
  media: {
    table: 'media',
    singular: 'photograph',
    order: [
      { column: 'category', ascending: true },
      { column: 'sort', ascending: true },
    ],
    fields: [
      { name: 'url', label: 'Photograph', type: 'image', required: true, wide: true },
      { name: 'alt', label: 'Alt text (describe the photo)', type: 'text', required: true, wide: true },
      { name: 'caption', label: 'Caption', type: 'text', wide: true },
      {
        name: 'category',
        label: 'Gallery category',
        type: 'select',
        required: true,
        options: [
          { value: 'room', label: 'Room' },
          { value: 'property', label: 'Property' },
          { value: 'occasion', label: 'Occasion' },
          { value: 'neighbourhood', label: 'Neighbourhood' },
        ],
      },
      { name: 'room_type_id', label: 'Room type gallery', type: 'select', ref: 'room_types', help: 'Shows on that room’s page.' },
      SORT,
    ],
  },
  customers: {
    table: 'customers',
    singular: 'customer',
    order: [{ column: 'created_at', ascending: false }],
    fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone / WhatsApp', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
} satisfies Record<string, ResourceDef>

export type ResourceKey = keyof typeof RESOURCES

export function isResourceKey(key: string): key is ResourceKey {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key)
}
