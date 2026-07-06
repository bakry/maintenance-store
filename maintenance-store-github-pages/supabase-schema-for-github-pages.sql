create table if not exists public.app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "maintenance_store_read" on public.app_state;
drop policy if exists "maintenance_store_insert" on public.app_state;
drop policy if exists "maintenance_store_update" on public.app_state;

create policy "maintenance_store_read"
on public.app_state for select
to anon
using (id = 'maintenance-store');

create policy "maintenance_store_insert"
on public.app_state for insert
to anon
with check (id = 'maintenance-store');

create policy "maintenance_store_update"
on public.app_state for update
to anon
using (id = 'maintenance-store')
with check (id = 'maintenance-store');
