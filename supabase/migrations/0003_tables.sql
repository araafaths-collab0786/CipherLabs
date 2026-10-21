-- =============================================================================
-- Migration 0003: Core Tables, Integrity Constraints & RLS Policies
-- =============================================================================

-- Devices Table (strictly no hardware fingerprints)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_device_id uuid not null,
  label text null check (label is null or char_length(label) <= 60),
  os_name text null,
  os_version text null,
  app_version text not null,
  last_seen_at timestamptz not null default now(),
  unique (user_id, app_device_id)
);

-- Operations Table
create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_type text not null check (operation_type in ('ERASURE_SIMULATION', 'RECOVERY_TEST')),
  mode text not null check (mode in ('SIMULATION_ONLY', 'TEST_IMAGE')),
  target_reference text not null,
  method text not null,
  execution_status text not null check (execution_status in (
    'SIMULATION_COMPLETED',
    'RECOVERY_COMPLETED',
    'EXECUTION_FAILED',
    'PARTIALLY_COMPLETED',
    'CANCELLED',
    'INTERRUPTED',
    'RUNNING'
  )),
  verification_status text not null check (verification_status in (
    'SIMULATION_CHECK_PASSED',
    'SIMULATION_CHECK_FAILED',
    'VERIFIED',
    'VERIFICATION_FAILED',
    'UNVERIFIED',
    'NOT_APPLICABLE'
  )),
  -- Simulation type strictly pairs with simulation mode
  check ((operation_type = 'ERASURE_SIMULATION') = (mode = 'SIMULATION_ONLY')),
  -- Simulations can ONLY have simulation-specific verification status
  check (
    (operation_type = 'ERASURE_SIMULATION' and verification_status in ('SIMULATION_CHECK_PASSED', 'SIMULATION_CHECK_FAILED', 'UNVERIFIED', 'NOT_APPLICABLE'))
    or
    (operation_type = 'RECOVERY_TEST' and verification_status in ('VERIFIED', 'VERIFICATION_FAILED', 'UNVERIFIED', 'NOT_APPLICABLE'))
  ),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique (user_id, idempotency_key)
);

-- Operation Events Table
create table if not exists public.operation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  safe_details jsonb not null default '{}'::jsonb
);

-- Reports Table (with Idempotency Key & Per-User Unique Constraint)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  idempotency_key text not null,
  report_status text not null check (report_status in ('COMPLETE', 'INCOMPLETE')),
  report_json jsonb not null,
  report_sha256 text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

-- Audit Log Table (Append-only chained ledger)
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  operation_id uuid null references public.operations(id) on delete set null,
  previous_hash text not null,
  entry_hash text not null,
  created_at timestamptz not null default now()
);

-- Recovery Scans & Candidates (Forensic Lab)
create table if not exists public.recovery_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_reference text not null,
  status text not null check (status in ('SCANNING', 'COMPLETED', 'FAILED', 'INTERRUPTED')),
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists public.recovery_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid not null references public.recovery_scans(id) on delete cascade,
  file_type text not null,
  byte_offset bigint not null,
  estimated_size bigint not null,
  state text not null check (state in ('DETECTED', 'VALIDATED', 'RECOVERED', 'VALIDATION_FAILED', 'WRITE_FAILED', 'PARTIAL')),
  confidence integer not null check (confidence between 0 and 100),
  classifier_label text null,
  validation_checks jsonb not null default '{}'::jsonb,
  sha256 text null
);

-- Enable RLS on all tables
alter table public.devices enable row level security;
alter table public.operations enable row level security;
alter table public.operation_events enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;
alter table public.recovery_scans enable row level security;
alter table public.recovery_candidates enable row level security;

-- Policies: devices
create policy "devices_all_own" on public.devices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies: operations
create policy "operations_all_own" on public.operations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies: operation_events
create policy "operation_events_all_own" on public.operation_events
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies: reports
create policy "reports_all_own" on public.reports
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies: audit_log (SELECT ONLY - direct inserts, updates, deletes blocked)
create policy "audit_log_select_own" on public.audit_log
  for select to authenticated
  using (user_id = auth.uid());

-- Policies: recovery_scans & candidates
create policy "recovery_scans_all_own" on public.recovery_scans
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "recovery_candidates_all_own" on public.recovery_candidates
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
