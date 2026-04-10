-- Run this after the account btesfaye236@gmail.com has signed up.
-- It ensures the production owner account is marked as admin.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'tenant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when lower(coalesce(new.email, '')) = 'btesfaye236@gmail.com' then 'admin'
      else 'tenant'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        role = case
          when lower(excluded.email) = 'btesfaye236@gmail.com' then 'admin'
          else public.profiles.role
        end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, email, role)
select id, email, case when lower(email) = 'btesfaye236@gmail.com' then 'admin' else 'tenant' end
from auth.users
on conflict (id) do update
set email = excluded.email,
    role = case
      when lower(excluded.email) = 'btesfaye236@gmail.com' then 'admin'
      else public.profiles.role
    end,
    updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
