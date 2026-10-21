# CIPHER LABS - PHASED BUILD PROMPT (v3 - RECONCILED & CORRECTED)
===================================================================

This document is the authoritative, 100% reconciled specification for Cipher Labs.
All 5 conflicts between PART 5, 7, 10, 14, and build requirements have been resolved directly in the core text.

Reconciled Corrections:
1. Supabase Key Validation: Modern `sb_publishable_...` keys are the default standard; legacy 3-segment JWT anon keys are supported for backward compatibility. Key values are never printed.
2. Build Automation: `scripts/build_all.ps1` is the single authoritative release-build script. It loads configuration, exports environment variables in the parent process, and executes backend sidecar packaging, frontend tests, frontend build, and Tauri packaging in verified order.
3. Desktop Auth Callbacks: Tauri deep-link plugin (`tauri-plugin-deep-link`) integration with custom protocol `com.cipherlabs.desktop://auth/callback`, Rust 1.90+ minimum requirement, and Supabase redirect URI synchronization.
4. Audit Log Integrity & Report Idempotency: Direct table inserts to `audit_log` are revoked; append-only entries are written exclusively via a security-definer database function `public.log_audit_event()` that cryptographically chains hashes. Reports table enforces idempotency via `idempotency_key` and `unique (user_id, idempotency_key)`.
5. Fresh-Clone Installation Order: Prerequisite environment checks (Node.js, Rust, Python) run before package installation. Dependencies are installed via `npm ci` / `npm install` before validating the local Tauri CLI version, preventing fresh-clone deadlocks.

---

## PART 1 - LOCKED DECISIONS (DO NOT CHANGE)

### Platform
- Target: Windows 10 (21H2 or later) and Windows 11, 64-bit only.
- Linux and macOS are out of scope. Do not add platform branches for them.

### Stack
- Desktop shell: Tauri v2 (Rust 1.90+, `tauri`, `tauri-plugin-shell`, and `tauri-plugin-deep-link` v2).
- Frontend: React 18/19, TypeScript (strict), Vite, Tailwind CSS, Motion for React, lucide-react, @supabase/supabase-js.
- Local backend: Python 3.11, FastAPI, Pydantic v2, uvicorn, packaged with PyInstaller as a Tauri sidecar.
- Database, authentication, and authorisation: Supabase only (PostgreSQL, Supabase Auth, Row Level Security).
- Machine learning (Phase 2): scikit-learn RandomForestClassifier on synthetic disk fixtures.

### Scope of this Release
- No real modification or deletion of any file or folder outside the application-controlled test data directory.
- No real erasure of user data. No scanning of internal or attached drives. No raw disk access.
- Erasure is SIMULATION ONLY.
- Recovery works ONLY on test disk images and controlled test-data files created inside the app data folder.

---

## PART 2 - PRODUCT IDENTITY AND CORE RULES

- Name: Cipher Labs
- Tagline: SECURE. RECOVER. VERIFY.
- Descriptor: Digital Forensics and Data Sanitization

### Exact Simulation Labels (PART 2.1)
- Operation type label: "Simulation"
- Verification status values: `SIMULATION_CHECK_PASSED` or `SIMULATION_CHECK_FAILED`
- UI text for `SIMULATION_CHECK_PASSED`: "Simulation check passed. No file changes were detected. This is not physical erasure verification."
- UI text for `SIMULATION_CHECK_FAILED`: "Simulation check failed. A file change was detected. Review the details before doing anything else."
- Report text: "This is a simulation. No physical erasure was performed. The check confirms only that the simulated targets were not changed."
- Forbidden words for simulation results: "Verified", "Erased", "Sanitized", "Destroyed".

---

## PART 3 - DESIGN SPECIFICATION

- Left sidebar ~260px wide, white (light) or deep navy `#0B1F3A` (dark), right border.
- Sidebar header: rounded cyan square (`#06B6D4`) with white shield-check icon, bold "Cipher Labs", small letter-spaced cyan "SECURE. RECOVER. VERIFY.".
- Navigation items (exact order):
  1. Dashboard (`/`)
  2. Secure Erasure (`/erasure`)
  3. File Recovery (`/recovery`)
  4. Verification Center (`/verification`)
  5. Reports & Audit (`/reports`)
  6. Devices (`/devices`)
  7. Settings (`/settings`)
- Active item: light cyan pill (`#E0F7FB` light, `#123A55` dark) with teal text (`#0E7490` light, `#67E8F9` dark).
- Color tokens: Navy `#0B1F3A`, Cyan `#06B6D4`, Mist `#F3F6F8`, Cyan Text `#0E7490`, Success `#16A34A`, Danger `#DC2626`, Warning `#D97706`, Muted `#64748B`, Info `#2563EB`.

---

## PART 4 - AUTHENTICATION & DESKTOP CALLBACKS

- Signup fields: First name, Last name, Email, Phone number (optional, `+XXXXXXXX`), Password, Confirm password.
- Profile row is automatically created by a database trigger on `auth.users`.
- Repair path: `POST /api/profile/ensure` is idempotent.
- Desktop Auth Deep-linking:
  - Deep link scheme: `com.cipherlabs.desktop://auth/callback`
  - Tauri handles OAuth redirect events via `tauri-plugin-deep-link`.
  - Supabase Auth Redirect URL allowlist: `com.cipherlabs.desktop://auth/callback` and `http://localhost:1420`.
  - Google Sign-In is marked active only after end-to-end desktop deep-link integration is validated.

---

## PART 5 - DATABASE SCHEMA & CRYPTOGRAPHIC AUDIT

### 5.1 Profiles & Trigger (0001_profiles_trigger.sql)
Creates `public.profiles` and `handle_new_user()` security definer trigger on `auth.users`.

### 5.2 Grants, Controlled Audit Function & RLS (0002_rls.sql)
- RLS enabled on all tables (`profiles`, `devices`, `operations`, `operation_events`, `reports`, `audit_log`).
- `audit_log` direct `INSERT`, `UPDATE`, and `DELETE` privileges are REVOKED from `authenticated` and `anon`.
- Audit entries are inserted ONLY via the security-definer stored procedure:
  ```sql
  create or replace function public.log_audit_event(
    p_action text,
    p_operation_id uuid,
    p_safe_details jsonb
  ) returns bigint;
  ```
- This function computes:
  `entry_hash = encode(sha256((coalesce(last_hash, 'GENESIS') || p_action || canonical_json)::bytea), 'hex')`
  ensuring tamper-proof append-only integrity.

### 5.3 Tables & Constraints (0003_tables.sql)
- `reports` table includes:
  `idempotency_key text not null`
  `unique (user_id, idempotency_key)`
- `operations` table enforces:
  `check ((operation_type = 'ERASURE_SIMULATION') = (mode = 'SIMULATION_ONLY'))`
  `check ((operation_type = 'ERASURE_SIMULATION' and verification_status in ('SIMULATION_CHECK_PASSED', 'SIMULATION_CHECK_FAILED', 'UNVERIFIED', 'NOT_APPLICABLE')) or (operation_type = 'RECOVERY_TEST' and verification_status in ('VERIFIED', 'VERIFICATION_FAILED', 'UNVERIFIED', 'NOT_APPLICABLE')))`

---

## PART 6 - NEW FEATURE: SECURE DELETION AND RECOVERY WORKFLOW

### 1. Feature Objective
Add a user-friendly file selection, secure deletion simulation, recovery-data management, and file restoration workflow to Cipher Labs.

### 2. Browse Files Interface
- Controlled test files only, located in `/app-data/test-workspace/`.
- Displays file name, type, size, modified timestamp, and SHA-256 hash.
- Explicit user confirmation required (typing `SIMULATE`).
- Strict sandbox boundary: refuses any path outside the test-data folder.

### 3. Recovery Copy and Restore Workflow
- Optional "Recovery Copy" creation before simulation runs.
- Stores copy inside `/app-data/recovery-vault/` and records cryptographic relationship.
- Restore capability: restores recovery copy to `/app-data/restored-output/`.
- Validates restored file using SHA-256 match against original test file recorded hash.
- Explicit safety disclaimer: demonstrates backup restoration; does not prove recovery of data after permanent physical destruction.

### 4. Forensic Recovery Mode (Test Disk Image)
- Read-only analysis of synthetic disk image.
- Carves JPEG, PNG, PDF, ZIP, GIF with header/footer/structure verification.
- Calculates rule-based confidence score (0 to 100).
- Collision-safe restoration (`filename_1.ext`).

### 5. Operation Status Tracking
Ten independent states tracked:
1. `Ready`
2. `Awaiting Confirmation`
3. `Simulation in Progress`
4. `Simulation Completed`
5. `Recovery Copy Available`
6. `Recovery in Progress`
7. `Recovery Completed`
8. `Verification Passed`
9. `Verification Failed`
10. `Operation Interrupted`

---

## PART 7 - SCRIPTS & PACKAGING

- `scripts/check_env.ps1`:
  1. Validates host OS, Node (>=20), Rust (>=1.90, target `x86_64-pc-windows-msvc`), Python (3.11), WebView2.
  2. Runs `npm ci` / `npm install` in `frontend/` BEFORE verifying Tauri CLI.
  3. Validates Supabase URL and modern `sb_publishable_...` key (or legacy 3-part JWT anon key). Does NOT print secrets.
- `scripts/build_all.ps1`:
  Single authoritative build runner. Exports environment variables in parent process, builds sidecar, runs frontend tests, compiles frontend, and builds Tauri NSIS package.
- `scripts/build_backend.ps1`:
  Packages FastAPI sidecar with PyInstaller to `cipher-backend-x86_64-pc-windows-msvc.exe`.
