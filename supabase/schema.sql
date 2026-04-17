-- Types
do $$ begin
  create type user_role as enum ('Admin', 'General User');
exception when duplicate_object then null; end $$;

do $$ begin
  create type batch_stage as enum ('Planned', 'Brewing', 'Fermenting', 'Conditioning', 'Packaging', 'Completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_type as enum ('Keg', 'Can');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tank_status as enum ('Available', 'In Use', 'Cleaning', 'Maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tank_type as enum ('Mash Tun', 'Brite Tank', 'Unitank', 'Fermenter');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_category as enum ('Malt', 'Hops', 'Yeast', 'Adjunct', 'Cans', 'Kegs', 'Labels');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role user_role not null default 'General User',
  status text not null default 'active' check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists beers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  style text not null,
  production_days integer,
  target_og numeric(8,3),
  target_fg numeric(8,3),
  target_abv numeric(5,2),
  target_ibu numeric(5,1),
  default_package_type package_type,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tanks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type tank_type not null,
  capacity_bbl numeric(8,2) not null,
  status tank_status not null default 'Available',
  last_cip_date date,
  created_at timestamptz not null default now()
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  beer_id uuid references beers(id) on delete set null,
  beer_name text not null,
  style text not null,
  stage batch_stage not null default 'Planned',
  planned_brew_date date not null,
  planned_end_date date,
  actual_brew_date date,
  assigned_tank_id uuid references tanks(id) on delete set null,
  target_volume_bbl numeric(8,2) not null,
  actual_volume_bbl numeric(8,2),
  og numeric(8,3),
  fg numeric(8,3),
  abv numeric(5,2),
  ibu numeric(5,1),
  package_type package_type,
  package_date date,
  packaged_units integer,
  notes text not null default '',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category inventory_category not null,
  on_hand numeric(10,2) not null default 0,
  unit text not null,
  reorder_threshold numeric(10,2) not null default 0,
  supplier text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  batch_id uuid references batches(id) on delete set null,
  adjustment_amount numeric(10,2) not null,
  adjustment_type text not null default 'adjustment' check (adjustment_type in ('received', 'used', 'waste', 'correction')),
  reason text not null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists batch_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  stage batch_stage not null,
  note text not null default '',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Updated at trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger beers_set_updated_at
before update on beers
for each row
execute function set_updated_at();

create or replace trigger batches_set_updated_at
before update on batches
for each row
execute function set_updated_at();

create or replace trigger inventory_items_set_updated_at
before update on inventory_items
for each row
execute function set_updated_at();

-- RLS
alter table app_users enable row level security;
alter table beers enable row level security;
alter table tanks enable row level security;
alter table batches enable row level security;
alter table inventory_items enable row level security;
alter table inventory_adjustments enable row level security;

-- Security definer function to check admin role without triggering RLS recursion
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and role = 'Admin'
  );
$$;

-- Policies (drop first so re-runs are safe)
do $$ declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

create policy "users_select" on app_users for select to authenticated using (true);
create policy "users_insert_own" on app_users for insert to authenticated
  with check (id = auth.uid());
create policy "users_update_own" on app_users for update to authenticated
  using (id = auth.uid());
create policy "users_all_admin" on app_users for all to authenticated
  using (is_admin())
  with check (is_admin());

create policy "beers_select" on beers for select to authenticated using (true);
create policy "beers_all_admin" on beers for all to authenticated
  using (is_admin())
  with check (is_admin());

create policy "tanks_select" on tanks for select to authenticated using (true);
create policy "tanks_all" on tanks for all to authenticated using (true) with check (true);

create policy "batches_select" on batches for select to authenticated using (true);
create policy "batches_all" on batches for all to authenticated using (true) with check (true);

create policy "inventory_select" on inventory_items for select to authenticated using (true);
create policy "inventory_all" on inventory_items for all to authenticated using (true) with check (true);

create policy "adjustments_select" on inventory_adjustments for select to authenticated using (true);
create policy "adjustments_all" on inventory_adjustments for all to authenticated using (true) with check (true);

alter table batch_logs enable row level security;
create policy "batch_logs_select" on batch_logs for select to authenticated using (true);
create policy "batch_logs_insert" on batch_logs for insert to authenticated with check (true);
