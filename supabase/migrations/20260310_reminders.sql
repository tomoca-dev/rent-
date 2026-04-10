create table if not exists public.reminder_queue (
  id uuid primary key default gen_random_uuid(),
  payment_id text,
  tenant_name text not null,
  tenant_email text not null,
  property_name text,
  unit text not null,
  amount numeric not null,
  due_date date not null,
  kind text not null default 'PRE_DUE',
  channel text not null default 'EMAIL',
  scheduled_for timestamptz not null,
  status text not null default 'QUEUED',
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists reminder_queue_status_scheduled_idx
  on public.reminder_queue (status, scheduled_for);
