-- ==============================================================================
-- ResuMentor / Skill-2-Career-AI Complete Database Schema Bootstrap
-- Run this script in the Supabase Dashboard -> SQL Editor
-- Sets up all tables, triggers, RLS policies, indexes, and migration tracking.
-- ==============================================================================

-- 1. Schema Migrations Tracking Table
create table if not exists public._schema_migrations (
  version varchar(255) primary key,
  applied_at timestamptz default now()
);

-- 2. Profiles Table referencing auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  full_name text,
  email text,
  role text default 'student',
  photo_url text,
  resume_data jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure columns exist if table was already partially created
alter table public.profiles
  add column if not exists name text,
  add column if not exists full_name text,
  add column if not exists resume_data jsonb default null;

-- Sync full_name if null
update public.profiles
set full_name = name
where full_name is null and name is not null;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Profiles RLS Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid() and admin_p.role = 'admin'
    )
  );

-- 3. Automated User Profile Provisioning Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  resolved_name text;
  resolved_role text;
  resolved_photo text;
begin
  resolved_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student');
  resolved_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  resolved_photo := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'photo_url', '');

  insert into public.profiles (id, name, full_name, email, role, photo_url)
  values (
    new.id,
    resolved_name,
    resolved_name,
    new.email,
    resolved_role,
    resolved_photo
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, public.profiles.name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    role = coalesce(excluded.role, public.profiles.role),
    photo_url = coalesce(excluded.photo_url, public.profiles.photo_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Pass Codes & Email Verification Table (otp_codes)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  purpose text not null default 'EMAIL_VERIFY',
  code_hash text not null,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  ip_address text,
  user_agent text
);

-- Ensure reset_token columns exist if table was already created
alter table public.otp_codes
  add column if not exists reset_token_hash text,
  add column if not exists reset_token_expires_at timestamptz,
  add column if not exists ip_address text,
  add column if not exists user_agent text;

-- Indexes for performance
create index if not exists idx_otp_codes_user_purpose on public.otp_codes(user_id, purpose);
create index if not exists idx_otp_codes_email on public.otp_codes(email);
create index if not exists idx_otp_codes_reset_token_hash on public.otp_codes(reset_token_hash);
create index if not exists idx_otp_codes_expires_at on public.otp_codes(expires_at);

-- Enable RLS (Service role can read/write, public restricted)
alter table public.otp_codes enable row level security;

-- 5. Audit Logging Infrastructure (auth_audit_logs)
create table if not exists public.auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  email text,
  event text not null,
  ip text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_audit_logs_email on public.auth_audit_logs(email);
create index if not exists idx_auth_audit_logs_event on public.auth_audit_logs(event);
create index if not exists idx_auth_audit_logs_created_at on public.auth_audit_logs(created_at);

alter table public.auth_audit_logs enable row level security;

-- 6. Mark All Migrations as Applied in tracking table
insert into public._schema_migrations (version)
values 
  ('20261018_01_init_profiles.sql'),
  ('20261018_02_add_resume_to_profiles.sql'),
  ('20261018_03_create_otp_codes.sql'),
  ('20261018_04_auth_system_hardening.sql')
on conflict (version) do nothing;
