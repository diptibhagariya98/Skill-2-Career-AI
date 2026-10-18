-- ==============================================================================
-- Add resume_data jsonb column to public.profiles
-- Allows per-user cloud persistence of resumes
-- ==============================================================================

alter table public.profiles
add column if not exists resume_data jsonb default null;

-- Index on id is already primary key
