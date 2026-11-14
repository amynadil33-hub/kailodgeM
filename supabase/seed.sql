-- Kai Lodge Maldives — starter data.
-- Room types, rates, room names and packages below are SAMPLES. Replace them in the admin portal
-- (Rooms, Rates, Personalise) before taking real bookings. No fees or bank accounts are seeded.

insert into public.site_settings (id, base_currency, advance_percent, payment_deadline_hours, early_late_policy)
values (1, 'MVR', 50, 24, 'Early check-in and late check-out are subject to availability and additional charges.')
on conflict (id) do nothing;

insert into public.amenities (slug, name, icon, scope, sort) values
  ('queen-bed', 'Queen-size bed', 'bed-double', 'room', 1),
  ('smart-tv', 'Smart TV', 'tv', 'room', 2),
  ('mini-fridge', 'Mini refrigerator', 'refrigerator', 'room', 3),
  ('coffee', 'Coffee', 'coffee', 'room', 4),
  ('hot-cold-water', 'Hot & cold water', 'droplets', 'room', 5),
  ('towels', 'Towels', 'bath', 'room', 6),
  ('blankets', 'Blankets', 'layers', 'room', 7),
  ('safe', 'Safe locker', 'lock', 'room', 8),
  ('hair-dryer', 'Hair dryer', 'wind', 'room', 9),
  ('mirror', 'Dressing mirror', 'scan-face', 'room', 10),
  ('emergency-light', 'Emergency light', 'lightbulb', 'room', 11),
  ('recliner', 'Recliner', 'armchair', 'room', 12),
  ('foot-massager', 'Foot massager', 'footprints', 'room', 13),
  ('balcony', 'Balcony', 'door-open', 'room', 14),
  ('city-view', 'City view', 'building-2', 'room', 15),
  ('wifi', 'Complimentary Wi-Fi', 'wifi', 'property', 20),
  ('kitchen', 'Equipped kitchen', 'cooking-pot', 'property', 21),
  ('microwave', 'Microwave', 'microwave', 'property', 22),
  ('rice-cooker', 'Rice cooker', 'soup', 'property', 23),
  ('egg-boiler', 'Egg boiler', 'egg', 'property', 24),
  ('washing-machine', 'Washing machine', 'washing-machine', 'property', 25),
  ('iron', 'Iron & ironing board', 'shirt', 'property', 26),
  ('access-24-7', '24/7 property access', 'key-round', 'property', 27)
on conflict (slug) do nothing;

-- SAMPLE room types (placeholder rates in the base currency)
insert into public.room_types (slug, name, tagline, description, base_rate, max_adults, max_children, max_guests, bed, sort) values
  ('queen-room', 'Queen Room', 'Calm, compact and everything you need.',
   'A restful room with a queen-size bed, Smart TV, coffee, mini refrigerator, hot and cold water and a safe locker.',
   1000, 2, 1, 3, 'Queen-size bed', 1),
  ('balcony-city-view', 'Balcony City View Room', 'Morning coffee above the rooftops.',
   'A private balcony and city view, plus all the essentials of the Queen Room.',
   1250, 2, 1, 3, 'Queen-size bed', 2),
  ('recliner-comfort', 'Recliner Comfort Room', 'Put your feet up after a long day.',
   'A recliner and foot massager alongside the queen-size bed, Smart TV and in-room coffee.',
   1150, 2, 1, 3, 'Queen-size bed', 3)
on conflict (slug) do nothing;

insert into public.room_type_amenities (room_type_id, amenity_id)
select t.id, a.id
  from public.room_types t
  join public.amenities a on a.slug in
    ('queen-bed', 'smart-tv', 'mini-fridge', 'coffee', 'hot-cold-water', 'towels', 'blankets', 'safe', 'hair-dryer', 'mirror', 'emergency-light')
on conflict do nothing;

insert into public.room_type_amenities (room_type_id, amenity_id)
select t.id, a.id from public.room_types t join public.amenities a on a.slug in ('balcony', 'city-view')
 where t.slug = 'balcony-city-view'
on conflict do nothing;

insert into public.room_type_amenities (room_type_id, amenity_id)
select t.id, a.id from public.room_types t join public.amenities a on a.slug in ('recliner', 'foot-massager')
 where t.slug = 'recliner-comfort'
on conflict do nothing;

-- SAMPLE physical rooms — rename/add to match the real property.
insert into public.rooms (room_type_id, name)
select id, 'Sample Room ' || sort from public.room_types
on conflict (name) do nothing;

-- SAMPLE fixed-price decoration packages (set price to null to make one quote-only)
insert into public.packages (slug, name, description, price, image_url, sort) values
  ('birthday', 'Birthday setup', 'Balloons, fairy lights and a celebratory room setup waiting when you arrive.', 600, '/images/decor-birthday.png', 1),
  ('anniversary', 'Anniversary setup', 'Rose petals, candles and a softly lit room for a quiet celebration together.', 750, '/images/decor-romantic.png', 2),
  ('romantic', 'Romantic evening', 'Rose petals on the bed, candles and towel art — a simple, thoughtful surprise.', 500, '/images/decor-romantic.png', 3)
on conflict (slug) do nothing;

insert into public.media (url, alt, category, room_type_id, sort)
select v.url, v.alt, v.category, t.id, v.sort
  from (values
    ('/images/room-queen-1.png', 'Deluxe queen room with city view and recliner', 'room', 'queen-room', 1),
    ('/images/room-grey-suite.jpg', 'Grey queen room with chandelier and full-height windows', 'room', 'queen-room', 2),
    ('/images/room-balcony-1.png', 'Room opening onto a balcony above Malé', 'room', 'balcony-city-view', 1),
    ('/images/room-recliner-1.png', 'Room with recliner and foot massager', 'room', 'recliner-comfort', 1),
    ('/images/property-entrance.png', 'Entrance lobby', 'property', null, 1),
    ('/images/property-kitchen.png', 'Shared guest kitchen', 'property', null, 2),
    ('/images/property-laundry.png', 'Guest laundry', 'property', null, 3),
    ('/images/motorcycle-rental.jpeg', 'Motorcycle rental for in-house guests', 'property', null, 4),
    ('/images/property-bathroom.jpg', 'Modern guest bathroom with rainfall shower', 'property', null, 5),
    ('/images/decor-birthday.png', 'Birthday room setup', 'occasion', null, 1),
    ('/images/decor-romantic.png', 'Romantic room setup', 'occasion', null, 2),
    ('/images/promo-deluxe-balcony.jpeg', 'Deluxe Queen Room with balcony promotional artwork', 'room', null, 10),
    ('/images/promo-deluxe-city.jpeg', 'Deluxe Queen Room with city view promotional artwork', 'room', null, 11),
    ('/images/promo-superior-queen.jpeg', 'Superior Queen Room promotional artwork', 'room', null, 12),
    ('/images/male-waterfront.png', 'Malé waterfront at sunset', 'neighbourhood', null, 1),
    ('/images/male-cafe.png', 'Local café in Malé', 'neighbourhood', null, 2),
    ('/images/male-beach.png', 'City beach in Malé', 'neighbourhood', null, 3),
    ('/images/male-neighbourhood.png', 'Residential lane in Malé', 'neighbourhood', null, 4)
  ) as v(url, alt, category, room_slug, sort)
  left join public.room_types t on t.slug = v.room_slug;

insert into public.places (name, description, image_url, sort) values
  ('Local cafés & short eats', 'Tea, hedhikaa and conversation in the cafés around us.', '/images/male-cafe.png', 1),
  ('The waterfront', 'Watch dhonis come and go along the harbour at sunset.', '/images/male-waterfront.png', 2),
  ('Rasfannu Beach', 'Malé’s artificial city beach — a favourite for an evening swim.', '/images/male-beach.png', 3),
  ('Neighbourhood lanes', 'Corner shops and everyday life just beyond the front door.', '/images/male-neighbourhood.png', 4);

-- Make your first owner account (sign up at /admin/login first, then run with your email):
-- insert into public.admin_users (user_id, role)
-- select id, 'owner' from auth.users where email = 'you@example.com';
