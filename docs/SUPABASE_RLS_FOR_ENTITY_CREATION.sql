alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "admin manage properties" on public.properties;
create policy "admin manage properties" on public.properties for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage units" on public.units;
create policy "admin manage units" on public.units for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage tenants" on public.tenants;
create policy "admin manage tenants" on public.tenants for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage leases" on public.leases;
create policy "admin manage leases" on public.leases for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage payment events" on public.payment_events;
create policy "admin manage payment events" on public.payment_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read properties" on public.properties;
create policy "admin read properties" on public.properties for select to authenticated using (public.is_admin());

drop policy if exists "admin read units" on public.units;
create policy "admin read units" on public.units for select to authenticated using (public.is_admin());

drop policy if exists "admin read tenants" on public.tenants;
create policy "admin read tenants" on public.tenants for select to authenticated using (public.is_admin());

drop policy if exists "admin read leases" on public.leases;
create policy "admin read leases" on public.leases for select to authenticated using (public.is_admin());

drop policy if exists "admin read payment events" on public.payment_events;
create policy "admin read payment events" on public.payment_events for select to authenticated using (public.is_admin());
