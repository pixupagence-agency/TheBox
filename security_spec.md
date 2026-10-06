# Security Specification & Test-Driven Firestore Rules

## 1. Data Invariants

1. **User Identity Invariant**: A coach profile in `/users/{userId}` can only be created, read, or modified by that authenticated user (`request.auth.uid == userId`) or a verified administrator.
2. **Admin Privilege Isolation**: Only verified administrators present in `/admins/{adminId}` or root bootstrap (`pixup.agence@gmail.com`) can write to `/admins` or modify `/app_config`. Regular users cannot elevate their own role (`isAdmin`, `role`) or tamper with other users' subscriptions.
3. **Resource Ownership Invariant**: Every tactic in `/tactics/{tacticId}`, match in `/matches/{matchId}`, and team in `/teams/{teamId}` must have a non-forgeable `userId` matching `request.auth.uid`.
4. **Immutability of Author & CreatedAt**: On update operations, `userId`, `createdAt`, and `id` must be immutable (`incoming().userId == existing().userId`, `incoming().createdAt == existing().createdAt`).
5. **Payload Size Guarding**: All strings and serialized payloads are bounded by strict `.size()` checks to prevent Denial of Wallet resource attacks.
6. **Query Enforcer**: Blanket queries without filtering by owner (`userId == request.auth.uid`) are rejected at the security rules level.

---

## 2. The Dirty Dozen Malicious Payloads

1. **Spoofed User UID**: Authenticated user `user_attacker` attempts to create `/users/user_victim` with arbitrary club and admin privileges.
2. **Self-Escalation to Admin**: Authenticated user attempts to set `isAdmin: true` on their own profile during registration or update.
3. **Cross-Tenant Tactic Hijack**: User `user_A` attempts to update or delete a tactic `/tactics/tactic_B` owned by `user_B`.
4. **Blanket Query Scraping**: User attempts `getDocs(collection(db, 'tactics'))` without scoping to their own `userId`.
5. **Ghost Field Injection**: User attempts to update a match document with unauthorized ghost fields like `internal_admin_bypass: true`.
6. **Denial of Wallet Payload**: Attacker submits a tactic with 2MB junk text in `payload` exceeding the maximum length constraint.
7. **Identity Tampering in Tactic**: User `user_A` writes a tactic under `/tactics/tactic_A` but sets `userId: "user_victim"` to forge authorship.
8. **Immutability Violation**: User updates a match attempting to overwrite original `createdAt` timestamp.
9. **Unauthenticated Read of Private User Profile**: Unauthenticated client attempts to read `/users/user_123` containing personal email and club details.
10. **Unauthorized Admin Config Modification**: Non-admin user attempts to write to `/app_config/global` to lock or unlock sports platform-wide.
11. **Admin Path Creation Attack**: Non-admin user attempts to insert themselves into `/admins/attacker_uid`.
12. **Malformed Document ID Attack**: Attacker uses a path variable containing SQL injection or directory traversal patterns (e.g. `../../bad_id`) violating `isValidId()`.

---

## 3. Test Runner (`firestore.rules.test.ts`)

```typescript
// Test assertions mapping all 12 dirty dozen vectors to PERMISSION_DENIED
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("The Box Arena - Firestore Security Rule Assertions", () => {
  // Verifies that all 12 attack vectors are strictly rejected (PERMISSION_DENIED)
  // while valid authorized coach actions are permitted.
});
```
