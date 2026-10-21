-- =============================================================================
-- Migration 0001: Profiles & User Creation Trigger
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text null check (phone is null or phone ~ '^\+[0-9]{8,15}$'),
  email text not null,
  preferences jsonb not null default '{"theme": "dark", "keep_logs_days": 90}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security definer trigger function to safely create profile upon auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'), ''), 'Forensics'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'), ''), 'Operator'),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    coalesce(new.email, 'unknown@cipherlabs.local')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
