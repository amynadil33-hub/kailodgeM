import {
  Armchair,
  Bath,
  BedDouble,
  Building2,
  Check,
  Coffee,
  CookingPot,
  DoorOpen,
  Droplets,
  Egg,
  Footprints,
  KeyRound,
  Layers,
  Lightbulb,
  Lock,
  Microwave,
  Refrigerator,
  ScanFace,
  Shirt,
  Soup,
  Tv,
  WashingMachine,
  Wifi,
  Wind,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  'bed-double': BedDouble,
  tv: Tv,
  refrigerator: Refrigerator,
  coffee: Coffee,
  droplets: Droplets,
  bath: Bath,
  layers: Layers,
  lock: Lock,
  wind: Wind,
  'scan-face': ScanFace,
  lightbulb: Lightbulb,
  armchair: Armchair,
  footprints: Footprints,
  'door-open': DoorOpen,
  'building-2': Building2,
  wifi: Wifi,
  'cooking-pot': CookingPot,
  microwave: Microwave,
  soup: Soup,
  egg: Egg,
  'washing-machine': WashingMachine,
  shirt: Shirt,
  'key-round': KeyRound,
}

export const AMENITY_ICON_NAMES = Object.keys(ICONS)

export function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Check
  return <Icon className={className} aria-hidden="true" />
}
