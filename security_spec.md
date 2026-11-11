# Firebase Security Specification - Cipher Labs

## 1. Data Invariants

1. **User Profile Ownership**: Users may only read or update their own `/users/{userId}` document.
2. **Operation Log Integrity**: An operation record must belong to the authenticated user (`userId == request.auth.uid`). Users can create and read their own operations, but immutable audit fields (`createdAt`, `userId`) cannot be modified after creation.
3. **Recovery Copy Authorization**: Access to `/recovery_copies/{copyId}` is strictly restricted to the user who owns the parent operation (`userId == request.auth.uid`).
4. **Report Verification**: Cryptographic deletion reports in `/reports/{reportId}` are readable and creatable only by the authenticated owner (`userId == request.auth.uid`).
5. **Audit Log Non-Repudiation**: Audit log records (`/audit_logs/{logId}`) are append-only for the authenticated user and cannot be deleted or modified once written.
6. **Default Deny**: Any collection path or unauthenticated access attempt is blocked by default (`allow read, write: if false`).

## 2. The "Dirty Dozen" Attack Payloads (Validation Scenarios)

1. **Spoofed User ID**: Creating an operation with `userId: "victim_user_123"` while authenticated as `attacker_456`.
2. **Missing Required Field**: Creating an operation missing `executionStatus` or `createdAt`.
3. **Unauthenticated Read**: Requesting `/users/user_123` without an Auth context.
4. **Cross-User Profile Read**: Reading `/users/victim_999` while authenticated as `user_123`.
5. **Ghost Field Update**: Attempting to inject `isAdmin: true` into a `/users/{userId}` update payload.
6. **Immutable Field Mutation**: Attempting to change `createdAt` on an existing operation document.
7. **Oversized String Injection**: Sending a 1MB `verificationMessage` payload to trigger denial of wallet or database resource exhaustion.
8. **Invalid Path ID**: Supplying a path document ID containing path traversal characters like `../admin/secret`.
9. **Audit Log Deletion**: Executing `deleteDoc(doc(db, 'audit_logs', 'log_001'))` as a standard user.
10. **Report Record Tampering**: Modifying `reportSha256` on an existing `/reports/{reportId}` document.
11. **Spoofed Email in Profile**: Setting an email without matching authenticated user claims.
12. **Orphaned Recovery Copy**: Creating a recovery copy referencing a non-existent operation or invalid `userId`.

## 3. Security Verification Strategy

The security rules implementation enforces:
- `rules_version = '2';`
- Global default deny catch-all `match /{document=**} { allow read, write: if false; }`
- Reusable helper functions (`isValidId`, `isSignedIn`, `incoming`, `existing`, `isOwner`)
- Individual entity shape validation helpers (`isValidUserProfile`, `isValidOperationRecord`, `isValidRecoveryCopyRecord`, `isValidReportRecord`, `isValidAuditLogEntry`)
- Strict `hasAll()` and `hasOnly()` key constraints on creations and updates.
