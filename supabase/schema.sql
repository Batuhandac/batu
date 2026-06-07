-- Pati SOS — Full Database Schema
-- Run this in Supabase SQL editor (as postgres/service role)

-- Extensions
create extension if not exists "cube";
create extension if not exists "earthdistance";
create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text default 'Ankara',
  created_at timestamptz default now()
);

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  district text,
  city text default 'Ankara',
  lat double precision not null,
  lng double precision not null,
  phone text,
  google_place_id text,
  is_24_7 boolean default false,
  accepts_emergency boolean default false,
  has_night_shift boolean default false,
  is_verified boolean default false,
  verification_status text default 'seed',
  last_verified_at timestamptz,
  verified_by text,
  rating numeric,
  busyness text default 'unknown',
  phone_active boolean default true,
  photos jsonb default '[]',
  services jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  weekday smallint not null,
  open_time time,
  close_time time,
  is_closed boolean default false,
  is_overnight boolean default false
);

create table if not exists clinic_feedback (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  phone_answered boolean,
  accepted_emergency boolean,
  info_correct boolean,
  visited boolean,
  comment text,
  created_at timestamptz default now()
);

create table if not exists clinic_pings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  is_open_now boolean not null,
  created_at timestamptz default now()
);

create table if not exists clinic_reports (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  report_type text,
  detail text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists clinic_claims (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  claimant_name text,
  claimant_phone text,
  claimant_role text,
  message text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  species text,
  breed text,
  age_years numeric,
  weight_kg numeric,
  allergies text,
  chronic_conditions text,
  medications text,
  last_vaccine_date date,
  last_parasite_date date,
  emergency_note text,
  owner_name text,
  owner_phone text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  is_primary_vet boolean default false,
  created_at timestamptz default now(),
  unique (user_id, clinic_id)
);

create table if not exists user_events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  event_name text not null,
  clinic_id uuid,
  pet_id uuid,
  props jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists verification_log (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  verified_by text,
  notes text,
  created_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_clinic_feedback_clinic on clinic_feedback (clinic_id, created_at desc);
create index if not exists idx_clinic_pings_clinic on clinic_pings (clinic_id, created_at desc);
create index if not exists idx_clinics_lat_lng on clinics using btree (lat, lng);
create index if not exists idx_pets_user on pets (user_id);
create index if not exists idx_favorites_user on favorites (user_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_clinics_updated before update on clinics
  for each row execute function update_updated_at();
create trigger trg_pets_updated before update on pets
  for each row execute function update_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table clinics enable row level security;
alter table clinic_hours enable row level security;
alter table clinic_feedback enable row level security;
alter table clinic_pings enable row level security;
alter table clinic_reports enable row level security;
alter table clinic_claims enable row level security;
alter table pets enable row level security;
alter table favorites enable row level security;
alter table user_events enable row level security;
alter table verification_log enable row level security;

-- clinics: public read
create policy "Public read clinics" on clinics for select using (true);
create policy "Service role write clinics" on clinics for all using (auth.role() = 'service_role');

-- clinic_hours: public read
create policy "Public read clinic_hours" on clinic_hours for select using (true);
create policy "Service role write clinic_hours" on clinic_hours for all using (auth.role() = 'service_role');

-- verification_log: service role only
create policy "Service role verification_log" on verification_log for all using (auth.role() = 'service_role');

-- profiles: own row
create policy "Own profile" on profiles for all using (auth.uid() = id);

-- pets: own rows
create policy "Own pets" on pets for all using (auth.uid() = user_id);

-- favorites: own rows
create policy "Own favorites" on favorites for all using (auth.uid() = user_id);

-- clinic_feedback: own write, public read
create policy "Public read feedback" on clinic_feedback for select using (true);
create policy "Auth write feedback" on clinic_feedback for insert with check (auth.uid() = user_id or user_id is null);

-- clinic_pings: own write, public read
create policy "Public read pings" on clinic_pings for select using (true);
create policy "Auth write pings" on clinic_pings for insert with check (auth.uid() = user_id or user_id is null);

-- clinic_reports: own write
create policy "Auth write reports" on clinic_reports for insert with check (auth.uid() = user_id or user_id is null);
create policy "Service read reports" on clinic_reports for select using (auth.role() = 'service_role');

-- clinic_claims: own write
create policy "Auth write claims" on clinic_claims for insert with check (true);
create policy "Service read claims" on clinic_claims for select using (auth.role() = 'service_role');

-- user_events: own write
create policy "Own events write" on user_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "Service read events" on user_events for select using (auth.role() = 'service_role');
