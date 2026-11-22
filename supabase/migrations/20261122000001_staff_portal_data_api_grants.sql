-- New Supabase projects can require explicit Data API grants.
-- The row-level policies in the earlier migration still enforce staff and owner access.
grant usage on schema public to anon, authenticated, service_role;

grant select on
  public.site_settings, public.site_content, public.amenities, public.room_type_amenities,
  public.media, public.places, public.rate_periods, public.room_types, public.packages, public.fees
to anon;

grant select, insert, update, delete on
  public.admin_users, public.site_settings, public.site_content, public.amenities,
  public.room_type_amenities, public.media, public.places, public.rate_periods, public.room_types,
  public.packages, public.fees, public.bank_accounts, public.rooms, public.discounts,
  public.customers, public.bookings, public.room_allocations, public.payments,
  public.booking_requests, public.enquiries
to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to authenticated;

grant select, insert, update on public.admin_users to service_role;
grant select on public.bank_accounts, public.customers, public.discounts, public.payments, public.room_types to service_role;
grant select, update on public.bookings, public.booking_requests to service_role;
grant insert on public.payments, public.enquiries to service_role;

-- Ensure the settings page can save on an empty project without loading sample inventory.
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
