-- =============================================================================
-- Migration 0002: RLS Policies & Controlled Append-Only Audit Logging
-- =============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;

-- Revoke all direct privileges on public schema tables from anon
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;

-- Profiles policies
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow insert only for the profile-ensure repair path
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Controlled audit log append function (Security Definer)
-- Direct INSERT, UPDATE, DELETE permissions on audit_log are strictly revoked.
create or replace function public.log_audit_event(
  p_action text,
  p_operation_id uuid default null,
  p_safe_details jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_last_hash text;
  v_entry_hash text;
  v_inserted_id bigint;
  v_canonical_details text;
begin
  -- Validate caller authentication
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Audit events require valid user credentials';
  end if;

  -- Acquire user-level transaction advisory lock to guarantee serialized hash-chain ordering
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Retrieve most recent hash for this user (or GENESIS if first entry)
  select entry_hash into v_last_hash
  from public.audit_log
  where user_id = v_user_id
  order by id desc
  limit 1;

  if v_last_hash is null then
    v_last_hash := 'GENESIS';
  end if;

  -- Canonical JSON representation for deterministic hashing
  v_canonical_details := p_safe_details::text;

  -- Compute cryptographic SHA-256 hash: previous_hash || action || canonical_details || timestamp
  v_entry_hash := encode(sha256((v_last_hash || p_action || coalesce(p_operation_id::text, '') || v_canonical_details)::bytea), 'hex');

  -- Insert append-only entry
  insert into public.audit_log (
    user_id,
    action,
    operation_id,
    previous_hash,
    entry_hash,
    created_at
  ) values (
    v_user_id,
    p_action,
    p_operation_id,
    v_last_hash,
    v_entry_hash,
    now()
  ) returning id into v_inserted_id;

  return v_inserted_id;
end;
$$;

-- Grant execution of controlled audit logging to authenticated users
grant execute on function public.log_audit_event(text, uuid, jsonb) to authenticated;
revoke execute on function public.log_audit_event(text, uuid, jsonb) from anon, public;
