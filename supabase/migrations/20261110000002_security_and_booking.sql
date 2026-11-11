-- Kai Lodge Maldives — row level security, storage and booking functions

-- ─────────────────────────────────────────────────────────────
-- RLS: enable everywhere
-- ─────────────────────────────────────────────────────────────
alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.fees enable row level security;
alter table public.site_content enable row level security;
alter table public.amenities enable row level security;
alter table public.room_types enable row level security;
alter table public.room_type_amenities enable row level security;
alter table public.rooms enable row level security;
alter table public.rate_periods enable row level security;
alter table public.media enable row level security;
alter table public.places enable row level security;
alter table public.packages enable row level security;
alter table public.discounts enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.room_allocations enable row level security;
alter table public.payments enable row level security;
alter table public.booking_requests enable row level security;
alter table public.enquiries enable row level security;

-- Admin users: everyone can see their own row; only owners manage the list.
create policy admin_users_self_read on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy admin_users_owner_write on public.admin_users for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- Public website content (read-only for visitors)
create policy settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy content_public_read on public.site_content for select to anon, authenticated using (true);
create policy amenities_public_read on public.amenities for select to anon, authenticated using (true);
create policy rta_public_read on public.room_type_amenities for select to anon, authenticated using (true);
create policy media_public_read on public.media for select to anon, authenticated using (true);
create policy places_public_read on public.places for select to anon, authenticated using (true);
create policy rate_periods_public_read on public.rate_periods for select to anon, authenticated using (true);
create policy room_types_public_read on public.room_types for select to anon, authenticated
  using (active or public.is_admin());
create policy packages_public_read on public.packages for select to anon, authenticated
  using (active or public.is_admin());
create policy fees_public_read on public.fees for select to anon, authenticated
  using (active or public.is_admin());

-- Admin write access to content & configuration
do $$
declare t text;
begin
  foreach t in array array[
    'site_settings', 'site_content', 'amenities', 'room_type_amenities', 'media', 'places',
    'rate_periods', 'room_types', 'packages', 'fees'
  ] loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_admin_delete', t);
  end loop;
end $$;

-- Admin-only tables (guest flows reach these only through server code using the service role,
-- scoped by the booking's unguessable access token)
do $$
declare t text;
begin
  foreach t in array array[
    'bank_accounts', 'rooms', 'discounts', 'customers', 'bookings', 'room_allocations',
    'payments', 'booking_requests', 'enquiries'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Storage: public media bucket, admin-only writes
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy media_bucket_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
create policy media_bucket_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy media_bucket_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy media_bucket_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Booking helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.assert_staff_or_service()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
end;
$$;

-- Releases unpaid website holds whose payment deadline has passed.
create or replace function public.expire_stale_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  with expired as (
    update public.bookings
       set reservation_status = 'expired'
     where reservation_status = 'pending'
       and payment_status = 'unpaid'
       and hold_expires_at is not null
       and hold_expires_at < now()
    returning id
  )
  update public.room_allocations a
     set active = false
    from expired e
   where a.booking_id = e.id;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.room_type_availability(p_check_in date, p_check_out date)
returns table (room_type_id uuid, total_rooms integer, available_rooms integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_check_out <= p_check_in then
    raise exception 'check-out must be after check-in';
  end if;
  perform public.expire_stale_holds();
  return query
    select r.room_type_id,
           count(*)::integer as total_rooms,
           count(*) filter (where not exists (
             select 1 from public.room_allocations a
              where a.room_id = r.id
                and a.active
                and a.stay && daterange(p_check_in, p_check_out, '[)')
           ))::integer as available_rooms
      from public.rooms r
      join public.room_types t on t.id = r.room_type_id and t.active
     where r.active
     group by r.room_type_id;
end;
$$;

-- Generates a short, human-friendly booking reference such as KL-7Q4M2X.
create or replace function public.generate_booking_reference()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  ref text;
  i integer;
begin
  loop
    ref := 'KL-';
    for i in 1..6 loop
      ref := ref || substr(alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(alphabet)), 1);
    end loop;
    exit when not exists (select 1 from public.bookings where reference = ref);
  end loop;
  return ref;
end;
$$;

/*
  Creates a booking and allocates a physical room in one transaction.
  Prices are computed by the application server and passed in; this function only
  stores them. Room allocation relies on the exclusion constraint on room_allocations,
  so two simultaneous requests can never receive the same room for overlapping nights.
*/
create or replace function public.create_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_customer jsonb,
  p_totals jsonb,
  p_requests jsonb default '[]'::jsonb,
  p_discount_id uuid default null,
  p_source text default 'website',
  p_room_id uuid default null,
  p_status text default 'pending',
  p_hold_hours integer default 24,
  p_special_requests text default null,
  p_arrival_details text default null
)
returns table (booking_id uuid, reference text, access_token text, room_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type public.room_types%rowtype;
  v_customer_id uuid;
  v_booking public.bookings%rowtype;
  v_room uuid;
  v_candidate uuid;
  v_request jsonb;
begin
  perform public.assert_staff_or_service();
  perform public.expire_stale_holds();

  if p_check_out <= p_check_in then
    raise exception 'check-out must be after check-in' using errcode = '22023';
  end if;
  if p_adults < 1 or p_children < 0 then
    raise exception 'invalid guest count' using errcode = '22023';
  end if;
  if p_status not in ('pending', 'confirmed', 'checked_in') then
    raise exception 'invalid initial status' using errcode = '22023';
  end if;

  select * into v_type from public.room_types where id = p_room_type_id and active;
  if not found then
    raise exception 'room type unavailable' using errcode = 'P0002';
  end if;
  if p_adults > v_type.max_adults or p_children > v_type.max_children
     or p_adults + p_children > v_type.max_guests then
    raise exception 'guest count exceeds room capacity' using errcode = '22023';
  end if;

  if p_discount_id is not null then
    update public.discounts
       set used_count = used_count + 1
     where id = p_discount_id
       and active
       and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'discount no longer available' using errcode = 'P0001';
    end if;
  end if;

  -- Reuse a customer record when the email or phone matches.
  select c.id into v_customer_id
    from public.customers c
   where (nullif(p_customer->>'email', '') is not null and lower(c.email) = lower(p_customer->>'email'))
      or (nullif(p_customer->>'phone', '') is not null and c.phone = p_customer->>'phone')
   order by c.created_at
   limit 1;

  if v_customer_id is null then
    insert into public.customers (full_name, email, phone, country)
    values (
      p_customer->>'full_name',
      nullif(p_customer->>'email', ''),
      nullif(p_customer->>'phone', ''),
      nullif(p_customer->>'country', '')
    )
    returning id into v_customer_id;
  else
    update public.customers
       set full_name = coalesce(nullif(p_customer->>'full_name', ''), full_name),
           country = coalesce(nullif(p_customer->>'country', ''), country)
     where id = v_customer_id;
  end if;

  insert into public.bookings (
    reference, customer_id, room_type_id, check_in, check_out, adults, children, source,
    reservation_status, payment_status, currency, room_subtotal, discount_total, extras_total,
    fees_total, grand_total, advance_percent, advance_amount, price_breakdown, discount_id,
    special_requests, arrival_details, hold_expires_at, confirmed_at
  ) values (
    public.generate_booking_reference(), v_customer_id, p_room_type_id, p_check_in, p_check_out,
    p_adults, p_children, p_source, p_status, 'unpaid',
    p_totals->>'currency',
    (p_totals->>'room_subtotal')::numeric, (p_totals->>'discount_total')::numeric,
    (p_totals->>'extras_total')::numeric, (p_totals->>'fees_total')::numeric,
    (p_totals->>'grand_total')::numeric, (p_totals->>'advance_percent')::numeric,
    (p_totals->>'advance_amount')::numeric, p_totals, p_discount_id,
    p_special_requests, p_arrival_details,
    case when p_status = 'pending' and p_source = 'website' then now() + make_interval(hours => p_hold_hours) end,
    case when p_status <> 'pending' then now() end
  )
  returning * into v_booking;

  -- Allocate a physical room. A specific room may be requested by staff.
  for v_candidate in
    select r.id from public.rooms r
     where r.room_type_id = p_room_type_id
       and r.active
       and (p_room_id is null or r.id = p_room_id)
     order by r.name
  loop
    begin
      insert into public.room_allocations (room_id, booking_id, kind, stay)
      values (v_candidate, v_booking.id, 'booking', daterange(p_check_in, p_check_out, '[)'));
      v_room := v_candidate;
      exit;
    exception when exclusion_violation then
      -- Room taken for these nights; try the next one.
    end;
  end loop;

  if v_room is null then
    raise exception 'no rooms available for these dates' using errcode = 'P0001';
  end if;

  for v_request in select * from jsonb_array_elements(coalesce(p_requests, '[]'::jsonb))
  loop
    insert into public.booking_requests (booking_id, kind, package_id, title, details, status, amount, counts_towards_total)
    values (
      v_booking.id,
      v_request->>'kind',
      nullif(v_request->>'package_id', '')::uuid,
      v_request->>'title',
      nullif(v_request->>'details', ''),
      coalesce(v_request->>'status', 'quote_pending'),
      nullif(v_request->>'amount', '')::numeric,
      coalesce((v_request->>'counts_towards_total')::boolean, false)
    );
  end loop;

  return query select v_booking.id, v_booking.reference, v_booking.access_token, v_room;
end;
$$;

-- Moves a booking to a different physical room (or a different room of another type).
create or replace function public.reassign_booking_room(p_booking_id uuid, p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_booking public.bookings%rowtype;
begin
  perform public.assert_staff_or_service();
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found'; end if;

  update public.room_allocations set active = false where booking_id = p_booking_id and active;
  begin
    insert into public.room_allocations (room_id, booking_id, kind, stay)
    values (p_room_id, p_booking_id, 'booking', daterange(v_booking.check_in, v_booking.check_out, '[)'));
  exception when exclusion_violation then
    raise exception 'that room is already occupied on these dates' using errcode = 'P0001';
  end;
  update public.bookings
     set room_type_id = (select room_type_id from public.rooms where id = p_room_id)
   where id = p_booking_id;
end;
$$;

-- Keeps room allocations in step with reservation status changes.
create or replace function public.sync_allocation_with_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reservation_status in ('cancelled', 'expired', 'no_show')
     and old.reservation_status not in ('cancelled', 'expired', 'no_show') then
    update public.room_allocations set active = false where booking_id = new.id and active;
    if new.reservation_status = 'cancelled' then new.cancelled_at = now(); end if;
  end if;
  if new.reservation_status = 'confirmed' and old.reservation_status = 'pending' then
    new.confirmed_at = coalesce(new.confirmed_at, now());
    new.hold_expires_at = null;
  end if;
  return new;
end;
$$;

create trigger bookings_status_sync before update of reservation_status on public.bookings
  for each row execute function public.sync_allocation_with_status();

-- Recomputes payment status from verified payments; confirms the booking once the advance is in.
create or replace function public.refresh_booking_payment(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_paid numeric;
  v_refunded numeric;
  v_pending integer;
  v_status text;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then return; end if;

  select coalesce(sum(amount) filter (where status = 'verified' and kind <> 'refund'), 0),
         coalesce(sum(amount) filter (where status = 'verified' and kind = 'refund'), 0),
         count(*) filter (where status = 'pending' and kind <> 'refund')
    into v_paid, v_refunded, v_pending
    from public.payments where booking_id = p_booking_id;

  if v_refunded > 0 and v_refunded >= v_paid then
    v_status := 'refunded';
  elsif v_paid - v_refunded >= v_booking.grand_total and v_booking.grand_total > 0 then
    v_status := 'paid';
  elsif v_paid - v_refunded >= v_booking.advance_amount and v_booking.advance_amount > 0 then
    v_status := 'advance_paid';
  elsif v_paid - v_refunded > 0 then
    v_status := 'partially_paid';
  elsif v_pending > 0 then
    v_status := 'awaiting_verification';
  else
    v_status := 'unpaid';
  end if;

  update public.bookings
     set payment_status = v_status,
         reservation_status = case
           when reservation_status = 'pending' and v_status in ('advance_paid', 'paid') then 'confirmed'
           else reservation_status end
   where id = p_booking_id;
end;
$$;

create or replace function public.payments_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_booking_payment(coalesce(new.booking_id, old.booking_id));
  return null;
end;
$$;

create trigger payments_refresh after insert or update or delete on public.payments
  for each row execute function public.payments_after_change();

-- Function privileges: never callable anonymously.
revoke all on function public.create_booking(uuid, date, date, integer, integer, jsonb, jsonb, jsonb, uuid, text, uuid, text, integer, text, text) from public, anon;
revoke all on function public.reassign_booking_room(uuid, uuid) from public, anon;
revoke all on function public.refresh_booking_payment(uuid) from public, anon;
revoke all on function public.expire_stale_holds() from public, anon;
revoke all on function public.room_type_availability(date, date) from public, anon;
grant execute on function public.create_booking(uuid, date, date, integer, integer, jsonb, jsonb, jsonb, uuid, text, uuid, text, integer, text, text) to authenticated, service_role;
grant execute on function public.reassign_booking_room(uuid, uuid) to authenticated, service_role;
grant execute on function public.refresh_booking_payment(uuid) to authenticated, service_role;
grant execute on function public.expire_stale_holds() to authenticated, service_role;
grant execute on function public.room_type_availability(date, date) to authenticated, service_role;
