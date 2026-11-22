update public.site_content
set value = '/images/male-sunset.webp'
where key in ('home.intro_image', 'about.image')
  and value = '/images/property-entrance.png';

delete from public.media where url = '/images/property-entrance.png';

insert into public.media (url, alt, category, sort)
select '/images/male-sunset.webp', 'Illustrated sunset over coastal rooftops and the ocean', 'neighbourhood', 7
where not exists (select 1 from public.media where url = '/images/male-sunset.webp');
