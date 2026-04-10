create extension if not exists pgcrypto;

create table if not exists public.payments (
  id text primary key,
  tenantName text not null,
  unit text not null,
  amount numeric not null,
  currency text not null default 'ETB',
  status text not null,
  intent text not null,
  riskScore integer not null default 0,
  lastActivity text,
  routingBehavior text,
  financialStatus text,
  autonomousActions jsonb not null default '[]'::jsonb,
  proofUrl text,
  dueDate date not null,
  tenant jsonb,
  property jsonb,
  lease jsonb,
  predictedLateProbability numeric,
  reminderStatus text,
  behaviorInsight text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy if not exists "authenticated read payments"
  on public.payments
  for select
  to authenticated
  using (true);

create policy if not exists "authenticated write payments"
  on public.payments
  for all
  to authenticated
  using (true)
  with check (true);
