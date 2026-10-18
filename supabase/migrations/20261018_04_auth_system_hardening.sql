-- ==============================================================================
-- ResuMentor / Skill-2-Career-AI Authentication System Hardening Migration
-- 1. Harmonizes profiles schema (name and full_name backward/forward compatibility)
-- 2. Grants Admin RLS visibility to profiles
-- 3. Extends otp_codes for secure two-step password reset tokens (reset_token_hash)
-- 4. Creates auth_audit_logs for security trails and compliance
-- ==============================================================================

-- 1. Ensure profiles table has both name and full_name synced
alter table public.profiles
  add column if not exists full_name text;

-- Backfill full_name with name where full_name is null
update public.profiles
set full_name = name
where full_name is null and name is not null;

-- Update trigger function to populate both name and full_name
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

-- 2. Admin RLS policy for profiles
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

-- 3. Extend otp_codes for secure password reset tokens & audit metadata
alter table public.otp_codes
  add column if not exists reset_token_hash text,
  add column if not exists reset_token_expires_at timestamptz,
  add column if not exists ip_address text,
  add column if not exists user_agent text;

-- Index on reset_token_hash for fast single-use token lookups
create index if not exists idx_otp_codes_reset_token_hash on public.otp_codes(reset_token_hash);
create index if not exists idx_otp_codes_expires_at on public.otp_codes(expires_at);

-- 4. Auth audit logs table
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

-- Index for querying audit trails by email / event
create index if not exists idx_auth_audit_logs_email on public.auth_audit_logs(email);
create index if not exists idx_auth_audit_logs_event on public.auth_audit_logs(event);
create index if not exists idx_auth_audit_logs_created_at on public.auth_audit_logs(created_at);

-- Enable RLS on audit logs (Service role can read/write, public access restricted)
alter table public.auth_audit_logs enable row level security;
