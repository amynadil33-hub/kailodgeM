export type ContentFieldType = 'text' | 'textarea' | 'image'

export interface ContentField {
  key: string
  label: string
  page: string
  type: ContentFieldType
  default: string
}

export const CONTENT_FIELDS: ContentField[] = [
  // Home
  { page: 'Home', key: 'home.hero_eyebrow', label: 'Hero eyebrow', type: 'text', default: 'Muranga Magu · Malé' },
  { page: 'Home', key: 'home.hero_title', label: 'Hero title', type: 'text', default: 'Your Comfortable Stay in the Heart of Malé.' },
  { page: 'Home', key: 'home.hero_subtitle', label: 'Hero subtitle', type: 'textarea', default: 'A stay shaped around you — a calm, personal base in the middle of the capital’s everyday life.' },
  { page: 'Home', key: 'home.hero_image', label: 'Hero photograph', type: 'image', default: '/images/room-balcony-1.png' },
  { page: 'Home', key: 'home.intro_title', label: 'Introduction title', type: 'text', default: 'A city retreat, kept personal.' },
  { page: 'Home', key: 'home.intro_body', label: 'Introduction text', type: 'textarea', default: 'Kai Lodge is a boutique guesthouse for couples, locals visiting the capital, international travellers, business guests and families. Step out into the scooters, cafés and waterfront of Malé — then come back to a quiet, comfortable room that has been prepared around your plans.' },
  { page: 'Home', key: 'home.intro_image', label: 'Introduction photograph', type: 'image', default: '/images/property-entrance.png' },
  { page: 'Home', key: 'home.personal_title', label: 'Personalised stay title', type: 'text', default: 'A stay shaped around you.' },
  { page: 'Home', key: 'home.personal_body', label: 'Personalised stay text', type: 'textarea', default: 'Celebrating something? Arriving on a late flight? Staying for a month? Tell us, and we will shape the room and the details around you.' },
  { page: 'Home', key: 'home.city_title', label: 'Neighbourhood title', type: 'text', default: 'The energy of Malé, right outside.' },
  { page: 'Home', key: 'home.city_body', label: 'Neighbourhood text', type: 'textarea', default: 'Muranga Magu puts you among the everyday rhythm of the capital — corner cafés and short eats, busy lanes, the harbour and the seafront are all part of the stay.' },
  { page: 'Home', key: 'home.cta_title', label: 'Booking banner title', type: 'text', default: 'Plan your stay in Malé.' },
  { page: 'Home', key: 'home.cta_body', label: 'Booking banner text', type: 'textarea', default: 'Check dates online, or message us on WhatsApp and we will help you find the right room.' },

  // Rooms
  { page: 'Rooms', key: 'rooms.title', label: 'Page title', type: 'text', default: 'Rooms' },
  { page: 'Rooms', key: 'rooms.intro', label: 'Page introduction', type: 'textarea', default: 'Every room is set up for a restful night in the city: a queen-size bed, a Smart TV, a mini refrigerator, coffee and hot/cold water. Some rooms add a balcony, a city view or a recliner with a foot massager.' },

  // Amenities
  { page: 'Amenities', key: 'amenities.title', label: 'Page title', type: 'text', default: 'Amenities & services' },
  { page: 'Amenities', key: 'amenities.intro', label: 'Page introduction', type: 'textarea', default: 'The comforts of home in every room, plus a shared kitchen and laundry for longer stays.' },
  { page: 'Amenities', key: 'amenities.image', label: 'Feature photograph', type: 'image', default: '/images/property-kitchen.png' },
  { page: 'Amenities', key: 'amenities.access_note', label: 'Access & check-in note', type: 'textarea', default: 'The property is accessible 24/7. Early check-in and late check-out can be requested and are subject to availability and additional charges.' },

  // Personalise
  { page: 'Personalise', key: 'personalise.title', label: 'Page title', type: 'text', default: 'Personalise your stay' },
  { page: 'Personalise', key: 'personalise.intro', label: 'Page introduction', type: 'textarea', default: 'From a birthday surprise to a month-long stay, tell us what you have in mind. Fixed-price setups can be added when you book; anything custom is quoted first, and you approve the price before it is added.' },
  { page: 'Personalise', key: 'personalise.image', label: 'Header photograph', type: 'image', default: '/images/decor-romantic.png' },
  { page: 'Personalise', key: 'personalise.transfer_body', label: 'Airport transfer text', type: 'textarea', default: 'Share your flight details and we can help arrange a transfer from Velana International Airport. Availability and price are confirmed by our team.' },
  { page: 'Personalise', key: 'personalise.arrival_body', label: 'Early / late arrival text', type: 'textarea', default: 'Landing early or leaving late? Request an early check-in or late check-out. These depend on room availability and may carry an additional charge.' },
  { page: 'Personalise', key: 'personalise.extended_body', label: 'Extended stay text', type: 'textarea', default: 'Staying a few weeks or longer for work, study or medical visits? Ask us about monthly stays and we will reply with a tailored quote.' },

  // Gallery
  { page: 'Gallery', key: 'gallery.title', label: 'Page title', type: 'text', default: 'Gallery' },
  { page: 'Gallery', key: 'gallery.intro', label: 'Page introduction', type: 'textarea', default: 'Rooms, shared spaces, special occasions and the streets around us.' },

  // About
  { page: 'About', key: 'about.title', label: 'Page title', type: 'text', default: 'About Kai Lodge' },
  { page: 'About', key: 'about.story', label: 'Property story', type: 'textarea', default: 'Kai Lodge was created as a comfortable, personal place to stay in central Malé — somewhere that feels calm the moment you close the door, while the life of the city carries on outside. We keep things simple, clean and attentive, and we are always a message away.' },
  { page: 'About', key: 'about.image', label: 'Story photograph', type: 'image', default: '/images/property-entrance.png' },
  { page: 'About', key: 'about.igmh_body', label: 'IGMH highlight', type: 'textarea', default: 'Indira Gandhi Memorial Hospital (IGMH) is nearby — convenient for guests visiting Malé for appointments or to be close to family.' },
  { page: 'About', key: 'about.beach_body', label: 'Rasfannu Beach highlight', type: 'textarea', default: 'Rasfannu, Malé’s artificial beach on the western waterfront, is within reach for an evening swim or a walk along the sea.' },

  // Contact
  { page: 'Contact', key: 'contact.title', label: 'Page title', type: 'text', default: 'Contact us' },
  { page: 'Contact', key: 'contact.intro', label: 'Page introduction', type: 'textarea', default: 'Questions about rooms, dates or a special request? Send an enquiry, call, or message us on WhatsApp.' },
]

export type SiteContent = Record<string, string>

export function contentDefaults(): SiteContent {
  return Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.default]))
}
