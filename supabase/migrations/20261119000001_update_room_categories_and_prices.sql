update public.site_settings
set base_currency = 'MVR'
where id = 1;

update public.room_types
set
  name = 'Superior Queen Room',
  tagline = 'A calm, comfortable stay with room to unwind.',
  base_rate = 1000,
  sort = 1
where slug = 'recliner-comfort';

update public.room_types
set
  name = 'Deluxe Queen Room with Balcony',
  tagline = 'Morning coffee above the rooftops.',
  base_rate = 1200,
  sort = 2
where slug = 'balcony-city-view';

update public.room_types
set
  name = 'Deluxe Queen Room with City View',
  tagline = 'Comfort with a view across the city.',
  base_rate = 1200,
  sort = 3
where slug = 'queen-room';
