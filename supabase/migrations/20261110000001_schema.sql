-- Kai Lodge Maldives — core schema
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Admin access
-- ─────────────────────────────────────────────────────────────
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'owner');
$$;

-- ─────────────────────────────────────────────────────────────
-- Settings, payments config, CMS
-- ─────────────────────────────────────────────────────────────
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  property_name text not null default 'Kai Lodge Maldives',
  base_currency text not null default 'MVR' check (base_currency in ('MVR', 'USD')),
  usd_to_mvr_rate numeric(12, 4) check (usd_to_mvr_rate is null or usd_to_mvr_rate > 0),
  advance_percent numeric(5, 2) not null default 50 check (advance_percent between 0 and 100),
  payment_deadline_hours integer not null default 24 check (payment_deadline_hours between 1 and 720),
  check_in_time text,
  check_out_time text,
  phone text not null default '+960 7300036',
  whatsapp text not null default '9607300036',
  email text,
  address text not null default 'M. Khaleeju, Muranga Magu, Malé, Maldives',
  map_embed_url text,
  policies text,
  cancellation_policy text,
  early_late_policy text,
  updated_at timestamptz not null default now()
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  currency text,
  swift text,
  notes text,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('percent', 'per_night', 'per_stay')),
  amount numeric(12, 2) not null check (amount >= 0),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Rooms & inventory
-- ─────────────────────────────────────────────────────────────
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'check',
  scope text not null default 'room' check (scope in ('room', 'property')),
  description text,
  sort integer not null default 0
);

create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  tagline text,
  description text,
  base_rate numeric(12, 2) not null check (base_rate >= 0),
  max_adults integer not null default 2 check (max_adults >= 1),
  max_children integer not null default 0 check (max_children >= 0),
  max_guests integer not null default 2 check (max_guests >= 1),
  bed text,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.room_type_amenities (
  room_type_id uuid not null references public.room_types(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (room_type_id, amenity_id)
);

-- Physical, bookable rooms. Each belongs to one room type.
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  name text not null unique,
  floor text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table public.rate_periods (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  nightly_rate numeric(12, 2) not null check (nightly_rate >= 0),
  label text,
  check (ends_on >= starts_on)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text,
  alt text not null default '',
  caption text,
  category text not null check (category in ('room', 'property', 'occasion', 'neighbourhood')),
  room_type_id uuid references public.room_types(id) on delete set null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  distance text,
  image_url text,
  sort integer not null default 0
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price numeric(12, 2) check (price is null or price >= 0),
  image_url text,
  active boolean not null default true,
  sort integer not null default 0
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 32),
  name text not null,
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric(12, 2) not null check (value > 0),
  valid_from date,
  valid_to date,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  min_nights integer not null default 1 check (min_nights >= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

-- ─────────────────────────────────────────────────────────────
-- Guests & bookings
-- ─────────────────────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  country text,
  notes text,
  created_at timestamptz not null default now()
);
create index customers_email_idx on public.customers (lower(email));
create index customers_phone_idx on public.customers (phone);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- Unguessable token for the guest's private booking link.
  access_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  customer_id uuid not null references public.customers(id) on delete restrict,
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  adults integer not null check (adults >= 1),
  children integer not null default 0 check (children >= 0),
  source text not null default 'website'
    check (source in ('website', 'whatsapp', 'walk_in', 'phone', 'admin')),
  reservation_status text not null default 'pending'
    check (reservation_status in ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired', 'no_show')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'awaiting_verification', 'partially_paid', 'advance_paid', 'paid', 'refunded')),
  currency text not null check (currency in ('MVR', 'USD')),
  room_subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  extras_total numeric(12, 2) not null default 0,
  fees_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  advance_percent numeric(5, 2) not null default 0,
  advance_amount numeric(12, 2) not null default 0,
  price_breakdown jsonb not null default '{}'::jsonb,
  discount_id uuid references public.discounts(id) on delete set null,
  special_requests text,
  arrival_details text,
  admin_notes text,
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index bookings_dates_idx on public.bookings (check_in, check_out);
create index bookings_status_idx on public.bookings (reservation_status, payment_status);
create index bookings_customer_idx on public.bookings (customer_id);

-- Every occupancy of a physical room — bookings, walk-ins and maintenance blocks — lives here,
-- so a single exclusion constraint guards availability for all of them.
create table public.room_allocations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  kind text not null default 'booking' check (kind in ('booking', 'maintenance', 'block')),
  stay daterange not null,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (not isempty(stay) and lower_inc(stay) and not upper_inc(stay)),
  check ((kind = 'booking') = (booking_id is not null)),
  -- Half-open [check_in, check_out) ranges let one guest check out the same day another checks in.
  constraint room_allocations_no_overlap exclude using gist (room_id with =, stay with &&) where (active)
);
create index room_allocations_booking_idx on public.room_allocations (booking_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null default 'advance' check (kind in ('advance', 'balance', 'refund', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('MVR', 'USD')),
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'cash', 'card', 'other')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reference_note text,
  notes text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_booking_idx on public.payments (booking_id);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null check (kind in ('package', 'custom_decoration', 'airport_transfer', 'early_check_in', 'late_check_out', 'extended_stay', 'other')),
  package_id uuid references public.packages(id) on delete set null,
  title text not null,
  details text,
  -- included: fixed-price package already in the total. Custom items stay quote_pending until
  -- admin quotes them and the guest accepts; only accepted/included items count towards the total.
  status text not null default 'quote_pending'
    check (status in ('included', 'quote_pending', 'quoted', 'accepted', 'declined', 'fulfilled', 'cancelled')),
  amount numeric(12, 2) check (amount is null or amount >= 0),
  counts_towards_total boolean not null default false,
  admin_notes text,
  guest_responded_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);
create index booking_requests_booking_idx on public.booking_requests (booking_id);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();
