# Security Specification — Film & Video Studio Ultimate Firestore Rules

## 1. Data Invariants
1. A user document at `/users/{userId}` can only be created when `request.auth.uid == userId`, `email_verified == true`, `role == 'user'` (never self-assigned `'admin'`), and `createdAt == request.time`.
2. Users can read only their own `/users/{userId}` document (`list` is strictly restricted to admins) to isolate PII (`email`).
3. A `/projects/{projectId}`, `/library_assets/{assetId}`, or `/usage_logs/{logId}` document cannot exist without `ownerId == request.auth.uid` on create, and `ownerId` and `createdAt` are strictly immutable on update.
4. `allow list` on `/projects`, `/library_assets`, and `/usage_logs` enforces `isAdmin() || resource.data.ownerId == request.auth.uid` without relying on `get()` or client-only filters.
5. `usage_logs` are append-only (`allow update: if false;`) to preserve credit billing integrity.

## 2. Adversarial Payloads ("Dirty Dozen") Tested Against Rules
1. Unauthenticated `get` / `list` on `/users/u1` -> `PERMISSION_DENIED`.
2. Unverified email user creating `/users/u1` (`email_verified: false`) -> `PERMISSION_DENIED`.
3. Self-escalation on create: `{ uid: 'u1', role: 'admin', ... }` -> `PERMISSION_DENIED`.
4. Role escalation on update: non-admin updating `/users/u1` with `{ role: 'admin' }` -> `PERMISSION_DENIED`.
5. Shadow field injection on `/users/u1`: adding unknown key `unlimitedOverride: true` -> `PERMISSION_DENIED`.
6. Non-admin `list` on `/users` (PII scraping) -> `PERMISSION_DENIED`.
7.Spoofed admin email with `email_verified: false` -> `PERMISSION_DENIED`.
8. Non-owner reading another user's `/library_assets/asset1` -> `PERMISSION_DENIED`.
9. Cross-owner `list` query on `/library_assets` without `where('ownerId', '==', uid)` -> `PERMISSION_DENIED`.
10. Oversized ID injection (e.g., 500-char doc ID or invalid chars `../admin`) -> `PERMISSION_DENIED`.
11. Fake client timestamp on create (`createdAt != request.time`) -> `PERMISSION_DENIED`.
12. Mutating `usage_logs` (`update`) or tampering `ownerId` on `/projects` -> `PERMISSION_DENIED`.
