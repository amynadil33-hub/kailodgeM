-- Kai Lodge Maldives — admin operations

/*
  Moves a booking to new dates. Tries to keep the current physical room, then any other room of
  the same type. The exclusion constraint on room_allocations still guards every attempt, so an
  amendment can never double-book a room. Totals are re-priced by the application afterwards.
*/
create or replace function public.amend_booking_dates(p_booking_id uuid, p_check_in date, p_check_out date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_current uuid;
  v_candidate uuid;
  v_room uuid;
begin
  perform public.assert_staff_or_service();
  if p_check_out <= p_check_in then
    raise exception 'check-out must be after check-in' using errcode = '22023';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found' using errcode = 'P0002'; end if;
  if v_booking.reservation_status in ('cancelled', 'expired', 'no_show', 'checked_out') then
    raise exception 'this booking can no longer be amended' using errcode = 'P0001';
  end if;

  select room_id into v_current from public.room_allocations
   where booking_id = p_booking_id and active order by created_at desc limit 1;

  update public.room_allocations set active = false where booking_id = p_booking_id and active;

  for v_candidate in
    select r.id from public.rooms r
     where r.room_type_id = v_booking.room_type_id and r.active
     order by (r.id = v_current) desc, r.name
  loop
    begin
      insert into public.room_allocations (room_id, booking_id, kind, stay)
      values (v_candidate, p_booking_id, 'booking', daterange(p_check_in, p_check_out, '[)'));
      v_room := v_candidate;
      exit;
    exception when exclusion_violation then
    end;
  end loop;

  if v_room is null then
    raise exception 'no rooms available for these dates' using errcode = 'P0001';
  end if;

  update public.bookings set check_in = p_check_in, check_out = p_check_out where id = p_booking_id;
  return v_room;
end;
$$;

/*
  Re-activates a booking's room when staff restore a cancelled or expired reservation.
  Fails cleanly if the nights have been taken in the meantime.
*/
create or replace function public.restore_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_booking public.bookings%rowtype;
begin
  perform public.assert_staff_or_service();
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found' using errcode = 'P0002'; end if;
  if v_booking.reservation_status not in ('cancelled', 'expired', 'no_show') then
    return;
  end if;

  perform public.amend_booking_dates_internal(p_booking_id, v_booking.check_in, v_booking.check_out, v_booking.room_type_id);
  update public.bookings
     set reservation_status = 'pending', cancelled_at = null, hold_expires_at = null
   where id = p_booking_id;
end;
$$;

create or replace function public.amend_booking_dates_internal(
  p_booking_id uuid, p_check_in date, p_check_out date, p_room_type_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_candidate uuid; v_room uuid;
begin
  update public.room_allocations set active = false where booking_id = p_booking_id and active;
  for v_candidate in
    select r.id from public.rooms r where r.room_type_id = p_room_type_id and r.active order by r.name
  loop
    begin
      insert into public.room_allocations (room_id, booking_id, kind, stay)
      values (v_candidate, p_booking_id, 'booking', daterange(p_check_in, p_check_out, '[)'));
      v_room := v_candidate;
      exit;
    exception when exclusion_violation then
    end;
  end loop;
  if v_room is null then
    raise exception 'no rooms available for these dates' using errcode = 'P0001';
  end if;
  return v_room;
end;
$$;

revoke all on function public.amend_booking_dates(uuid, date, date) from public, anon;
revoke all on function public.restore_booking(uuid) from public, anon;
revoke all on function public.amend_booking_dates_internal(uuid, date, date, uuid) from public, anon, authenticated;
grant execute on function public.amend_booking_dates(uuid, date, date) to authenticated, service_role;
grant execute on function public.restore_booking(uuid) to authenticated, service_role;
