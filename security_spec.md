# Security Spec: Aver Platform Firestore Rules

## 1. Data Invariants
1. **User Ownership**: A user document under `/users/{userId}` can only be accessed, read, and modified by the owner (`request.auth.uid == userId`).
2. **Subcollection Isolation**: All subcollections (`portfolio`, `transactions`, `notifications`) are under `/users/{userId}/...` paths, creating physical resource isolation where access is strictly bound to the authenticated user owning that path (`request.auth.uid == userId`).
3. **Verified Email Mandate**: User writes (create and update) are allowed only if the user's email is verified (`request.auth.token.email_verified == true`).
4. **KYC Document Privacy**: KYC status and document URLs can only be modified by the user or system, and only readable by the owning user.
5. **Immutable Identity Fields**: Vital metadata like `uid`, `email`, and `createdAt` are immutable once set.
6. **Strict Input Typing**: Amounts, balances, and P&L figures must be numeric values and bounded to avoid overflow or Denial of Wallet attacks.

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Identity Spoofing (Creating user profile with another UID)
*   **Path**: `/users/attacker_uid`
*   **Payload**: `{ "uid": "victim_uid", "email": "victim@example.com" }`
*   **Expectation**: `PERMISSION_DENIED` (UID mismatch check)

### Payload 2: Privilege Escalation (Self-Assigned Admin Role or Custom Subscription Plan)
*   **Path**: `/users/user_uid`
*   **Payload**: `{ "uid": "user_uid", "email": "user@example.com", "subscriptionPlan": "Enterprise" }` (when subscription is restricted or cannot be modified by user)
*   **Expectation**: `PERMISSION_DENIED` (restricted keys check)

### Payload 3: Spoofed Email Verification Status (Claiming verified email on unverified auth)
*   **Path**: `/users/user_uid`
*   **Request Auth**: `{ uid: "user_uid", token: { email_verified: false } }`
*   **Expectation**: `PERMISSION_DENIED` (Email verification guard)

### Payload 4: Overwriting Other User's Portfolio Value
*   **Path**: `/users/victim_uid/portfolio/main`
*   **Request Auth**: `{ uid: "attacker_uid" }`
*   **Expectation**: `PERMISSION_DENIED` (Path user-id mismatch check)

### Payload 5: Injecting Extreme Junk String as Transaction ID
*   **Path**: `/users/user_uid/transactions/A` (with size 1000 characters)
*   **Expectation**: `PERMISSION_DENIED` (`isValidId` check)

### Payload 6: Negative Transaction Amount Injection (Arbitrary Deposit/Withdrawal manipulation)
*   **Path**: `/users/user_uid/transactions/tx_123`
*   **Payload**: `{ "id": "tx_123", "userId": "user_uid", "type": "deposit", "amount": -5000, "status": "completed" }`
*   **Expectation**: `PERMISSION_DENIED` (Boundary checks: `amount > 0`)

### Payload 7: Skipping Transaction Validation and Forging Completed Status
*   **Path**: `/users/user_uid/transactions/tx_123`
*   **Payload**: `{ "id": "tx_123", "userId": "user_uid", "type": "withdrawal", "amount": 100, "status": "completed" }` (Withdrawals must start as `pending`)
*   **Expectation**: `PERMISSION_DENIED` (Transaction state flow constraint)

### Payload 8: Modifying Immutable `createdAt` Field on User Update
*   **Path**: `/users/user_uid`
*   **Payload**: `{ "createdAt": "2020-01-01T00:00:00Z" }`
*   **Expectation**: `PERMISSION_DENIED` (Immutability check)

### Payload 9: Denial of Wallet - Injecting massive payload in settings or user photo
*   **Path**: `/users/user_uid`
*   **Payload**: `{ "photoURL": "data:image/png;base64,...[10MB content]..." }`
*   **Expectation**: `PERMISSION_DENIED` (Size constraints: `photoURL.size() <= 204800`)

### Payload 10: Modifying system-generated AI Trading Status without permission
*   **Path**: `/users/user_uid`
*   **Payload**: `{ "aiTradingStatus": "active" }` (by unverified client)
*   **Expectation**: `PERMISSION_DENIED` (if action-based updates are guarded)

### Payload 11: Bulk Scraping Notifications of Other Users (Blanket Read)
*   **Path**: `/users/victim_uid/notifications`
*   **Request Auth**: `{ uid: "attacker_uid" }`
*   **Expectation**: `PERMISSION_DENIED` (Path check)

### Payload 12: Injecting Ghost Field into Portfolio Data
*   **Path**: `/users/user_uid/portfolio/main`
*   **Payload**: `{ "balance": 100, "ghostField": true }`
*   **Expectation**: `PERMISSION_DENIED` (Strict schema / hasOnly check)

---

## 3. Test Verification
The ruleset is designed to fail-closed, ensuring that any write attempting to bypass standard authentication, email verification, or path isolation triggers an automatic `PERMISSION_DENIED`.
