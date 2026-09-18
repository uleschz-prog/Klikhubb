-- Opcional: persistir contratos y pagos en Supabase (Authentication ya cubre usuarios).
-- SQL Editor → New query → Run.

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  form_data jsonb not null,
  markdown text,
  payment_id text,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contracts enable row level security;

create policy "contracts_select_own"
  on public.contracts for select
  using (auth.uid() = user_id);

create policy "contracts_insert_own"
  on public.contracts for insert
  with check (auth.uid() = user_id);

create policy "contracts_update_own"
  on public.contracts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
