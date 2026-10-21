-- =============================================================================
-- Supabase RLS & Security Test Suite
-- =============================================================================

begin;

-- Create mock authenticated contexts
create or replace function pg_temp.set_user(p_uid uuid) returns void as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, true);
end;
$$ language plpgsql;

-- Test User IDs
do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  test_op_id uuid;
  direct_insert_failed boolean := false;
  audit_id_1 bigint;
  audit_id_2 bigint;
  hash_1 text;
  hash_2 text;
  dup_report_failed boolean := false;
begin
  -- 1. Test Profile Trigger & Isolation
  perform pg_temp.set_user(user_a);
  insert into public.profiles (id, first_name, last_name, email)
  values (user_a, 'Alice', 'Forensics', 'alice@cipherlabs.local');

  perform pg_temp.set_user(user_b);
  if exists (select 1 from public.profiles where id = user_a) then
    raise exception 'RLS VIOLATION: User B can read User A profile!';
  end if;

  -- 2. Test Audit Log Direct Insert Revocation
  perform pg_temp.set_user(user_a);
  begin
    insert into public.audit_log (user_id, action, previous_hash, entry_hash)
    values (user_a, 'ILLEGAL_DIRECT_INSERT', 'NONE', 'FAKEHASH');
  exception when insufficient_privilege then
    direct_insert_failed := true;
  end;

  if not direct_insert_failed then
    raise exception 'SECURITY VIOLATION: Direct insert to audit_log was not rejected!';
  end if;

  -- 3. Test Controlled Append-Only Audit Logging via Stored Function
  audit_id_1 := public.log_audit_event('SYSTEM_STARTUP', null, '{"component": "engine"}'::jsonb);
  select entry_hash into hash_1 from public.audit_log where id = audit_id_1;

  audit_id_2 := public.log_audit_event('SIMULATION_INITIATED', null, '{"targets": 3}'::jsonb);
  select previous_hash, entry_hash into hash_2 from public.audit_log where id = audit_id_2;

  if hash_2 <> hash_1 then
    raise exception 'AUDIT CHAIN BROKEN: Entry 2 previous_hash (%) != Entry 1 hash (%)', hash_2, hash_1;
  end if;

  -- 4. Test Report Idempotency Constraint
  insert into public.operations (
    user_id, operation_type, mode, target_reference, method, execution_status, verification_status, idempotency_key
  ) values (
    user_a, 'ERASURE_SIMULATION', 'SIMULATION_ONLY', 'target_01', 'NIST_800_88_CLEAR', 'SIMULATION_COMPLETED', 'SIMULATION_CHECK_PASSED', 'op-idem-001'
  ) returning id into test_op_id;

  insert into public.reports (
    user_id, operation_id, idempotency_key, report_status, report_json, report_sha256
  ) values (
    user_a, test_op_id, 'report-idem-999', 'COMPLETE', '{"test": 1}'::jsonb, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );

  begin
    insert into public.reports (
      user_id, operation_id, idempotency_key, report_status, report_json, report_sha256
    ) values (
      user_a, test_op_id, 'report-idem-999', 'COMPLETE', '{"test": 2}'::jsonb, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  exception when unique_violation then
    dup_report_failed := true;
  end;

  if not dup_report_failed then
    raise exception 'IDEMPOTENCY FAILURE: Duplicate report with same idempotency_key was accepted!';
  end if;

  raise notice 'RLS & SECURITY TEST SUITE PASSED ALL GATES';
end;
$$;

rollback;
