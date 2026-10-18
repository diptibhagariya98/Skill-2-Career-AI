-- ==============================================================================
-- Create otp_codes table for secure, code-driven 6-digit OTP email verification
-- ==============================================================================

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  purpose text not null default 'EMAIL_VERIFY',
  code_hash text not null,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

-- Indexes for performance
create index if not exists idx_otp_codes_user_purpose on public.otp_codes(user_id, purpose);
create index if not exists idx_otp_codes_email on public.otp_codes(email);

-- Enable RLS (Service role can read/write, public access is restricted)
alter table public.otp_codes enable row level security;
