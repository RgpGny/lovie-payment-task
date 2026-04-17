# Feature Specification: P2P Payment Request

**Feature Branch**: `001-p2p-payment-request`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Build a P2P payment request feature. Authenticated users can create a payment request by entering a recipient email, a dollar amount, and an optional note. The recipient signs in with the same email and sees the request in their inbox. They can either pay it or decline it. The sender can cancel any pending request. Every request expires 7 days after creation. Each request has a unique shareable public link. Money must be handled as integer cents end-to-end. Status transitions (pay, decline, cancel, expire) must be atomic and race-safe. Expiration must be computed at read time, not via background jobs. Row Level Security must guarantee a user can only see requests where they are the sender or the recipient."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sender creates a payment request (Priority: P1)

A signed-in user (the sender) wants to ask someone else for money. They open a "New Request" form, type the recipient's email, enter a dollar amount, optionally add a short note ("pizza last night"), and submit. The system records the request as `pending`, assigns it a unique shareable link, and shows the sender a success screen with the link and expiration date.

**Why this priority**: Without this, there is nothing to pay, decline, cancel, or expire. This user story alone — create and see the request — is already a viable MVP slice for demos.

**Independent Test**: Sign in as user A, fill and submit the form, confirm a success screen with a copy-able share link appears and the new request is visible to user A in their outgoing list.

**Acceptance Scenarios**:

1. **Given** a signed-in sender, **When** they submit a valid recipient email, a positive dollar amount, and a short note, **Then** the request is created with status `pending` and shown to the sender immediately with an expiration date 7 days from now.
2. **Given** a signed-in sender, **When** they submit an invalid email, a zero or negative amount, or a note longer than 200 characters, **Then** the submission is rejected with a clear error message and no request is created.
3. **Given** a signed-in sender, **When** the request is created, **Then** a unique share link is generated for it (distinct from any prior request's link).

---

### User Story 2 — Recipient pays a pending request (Priority: P1)

A signed-in user (the recipient) sees an incoming request in their inbox. They click into its detail page, confirm the amount, sender, and note, and press "Pay". The request transitions from `pending` to `paid` instantly; the sender sees the paid status the next time they refresh.

**Why this priority**: This is the core transaction that makes the feature fintech-meaningful. Without it, requests are informational only.

**Independent Test**: Seed one pending request addressed to user B, sign in as user B, pay it, confirm the status updates to `paid` and both parties see the transition.

**Acceptance Scenarios**:

1. **Given** a pending request addressed to the signed-in recipient, **When** they press Pay, **Then** the status becomes `paid` and a timestamp of payment is recorded.
2. **Given** two recipients pressing Pay at the same instant on the same request (race), **When** both requests reach the server, **Then** exactly one succeeds and the other receives a user-friendly "already paid" message.
3. **Given** a request that has already expired, **When** the recipient presses Pay, **Then** the attempt is rejected with an "expired" message and the status does not change.

---

### User Story 3 — Recipient declines a pending request (Priority: P1)

A signed-in recipient views an incoming request and decides they do not owe it — they press "Decline". The request transitions from `pending` to `declined`. The sender sees the declined status.

**Why this priority**: Payment is not always owed. Declining is the honest alternative to ignoring and is essential to the product's trust model.

**Independent Test**: Seed one pending request addressed to user B, sign in as user B, decline it, confirm status = `declined`.

**Acceptance Scenarios**:

1. **Given** a pending request addressed to the signed-in recipient, **When** they press Decline, **Then** the status becomes `declined` and a decline timestamp is recorded.
2. **Given** a request that is already paid, declined, cancelled, or expired, **When** the recipient presses Decline, **Then** the attempt is rejected and the original status is preserved.

---

### User Story 4 — Sender cancels their own pending request (Priority: P2)

A sender changes their mind. On the request detail page they see a "Cancel" button and press it. The request transitions from `pending` to `cancelled`. Neither party can act on it further.

**Why this priority**: Common real-world need (sent to wrong person, already settled offline). Slightly lower than P1 because the user can always wait for expiration.

**Independent Test**: Sign in as user A who has a pending outgoing request, press Cancel, confirm status = `cancelled` and the recipient can no longer pay it.

**Acceptance Scenarios**:

1. **Given** a sender with a pending outgoing request, **When** they press Cancel, **Then** the status becomes `cancelled` and a cancel timestamp is recorded.
2. **Given** a sender whose request has already been paid or declined, **When** they press Cancel, **Then** the attempt is rejected and the original status is preserved.
3. **Given** a recipient viewing a request they did not send, **When** they look for a Cancel action, **Then** no such control is available to them.

---

### User Story 5 — Expiration is visible without a background job (Priority: P2)

Every time a request is viewed — whether on the dashboard, the detail page, or the public share page — it shows a correct countdown to expiration (days, hours, minutes). After 7 days have passed since creation, the request visibly reads as `expired` and no payment or decline actions are possible, even if no server process ever "marked" it expired.

**Why this priority**: Users understand urgency from the countdown. Correctness here matters because a pay-after-expiry would undermine trust. Treated as P2 because it layers on top of the core create/pay flow.

**Independent Test**: Freeze the clock, create a request, advance system time by 7 days and 1 second, open the request, confirm it displays as expired and pay/decline fail with "expired" messages.

**Acceptance Scenarios**:

1. **Given** a pending request less than 7 days old, **When** a user views it, **Then** they see a countdown of remaining time.
2. **Given** a request that crossed its 7-day boundary, **When** anyone views it, **Then** it shows as expired regardless of whether any action updated a database row.
3. **Given** a request that crossed its 7-day boundary, **When** the recipient attempts to pay it, **Then** the attempt is rejected with an "expired" message.

---

### User Story 6 — Dashboard with tabs, filters, and search (Priority: P2)

A signed-in user opens their dashboard and sees two tabs: "Incoming" (requests where they are the recipient) and "Outgoing" (requests where they are the sender). Each tab supports filtering by status (pending, paid, declined, cancelled, expired) and a text search over the note and the counterparty email. Each card shows counterparty, amount, status, note snippet, and countdown.

**Why this priority**: Makes the app usable when a user has more than a handful of requests. Not P1 because a single request list is usable for a demo.

**Independent Test**: Seed one sender with several requests in different statuses, open the dashboard, switch between tabs, apply a status filter, type in the search field, and confirm each filter narrows the list correctly.

**Acceptance Scenarios**:

1. **Given** a user with requests in multiple statuses, **When** they apply a status filter, **Then** only requests matching that status appear.
2. **Given** a user on the Incoming tab, **When** the dashboard loads, **Then** they see only requests where they are the recipient; switching to Outgoing shows only requests they sent.
3. **Given** a user types a search term present in one request's note, **When** they submit the search, **Then** that request appears and unrelated requests are hidden.

---

### User Story 7 — Shareable public link (Priority: P3)

Each request has a unique, unguessable share link (`/pay/<token>`). Anyone with the link can see the request's amount, sender, note, status, and expiration — without logging in. If the viewer is signed in as the matching recipient, they can pay directly from that page. If not signed in (or signed in as a different user), they see the request but are prompted to sign in with the recipient email before paying.

**Why this priority**: Unlocks sharing over SMS/chat and deep-links from notifications. P3 because the dashboard flow already covers the core happy path.

**Independent Test**: Open the share link in an incognito window, confirm the public page renders with the request details and a sign-in prompt; sign in as the recipient and confirm the Pay button becomes available.

**Acceptance Scenarios**:

1. **Given** a public share link for a pending request, **When** an unauthenticated viewer opens it, **Then** they see amount, sender, note, status, and expiration countdown, but no Pay button until signed in.
2. **Given** a signed-in user who is not the recipient, **When** they open the share link, **Then** they can view the request but cannot pay, decline, or cancel it.
3. **Given** a signed-in user who is the recipient, **When** they open the share link, **Then** they can pay or decline exactly as on the internal detail page.

---

### Edge Cases

- The sender addresses a request to an email that does not yet correspond to a user account. The request is stored normally; the first time someone signs in with that email, they see the request waiting in their inbox.
- The recipient tries to pay a request that the sender cancelled two seconds ago. The atomic guard ensures the pay attempt fails with a clear message ("this request was cancelled").
- Two network retries from the same pay attempt both arrive at the server. At most one should succeed; the second must be an idempotent no-op or a safe error — the account history must not show two paid events.
- A sender tries to create a request addressed to their own email. The system rejects this with a clear error — a user cannot request money from themselves.
- A user opens the share link for a request that has been deleted or that never existed. They see a friendly 404, not a stack trace.
- The request's amount equals the maximum allowed (e.g., $999,999.99). The form and server accept it; display formatting stays readable.
- The note contains emoji, RTL characters, or characters that look like HTML. They render safely; no markup is injected into the page.
- A stale tab still shows a request as pending after it has expired. When the user clicks Pay, the server rejects it with an "expired" error rather than allowing a late payment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated user to create a payment request with a recipient email, a positive amount in whole cents up to $999,999.99, and an optional note of at most 200 characters.
- **FR-002**: System MUST reject request creation where the email is malformed, the amount is zero or negative, or the note exceeds 200 characters, with a user-readable message identifying the offending field.
- **FR-003**: System MUST assign each request a unique, unguessable share token at creation time and expose it at a shareable URL path.
- **FR-004**: System MUST set each request's status to `pending` on creation and record its creation timestamp.
- **FR-005**: System MUST derive each request's expiration as exactly 7 days after creation, evaluated at read time; the system MUST NOT rely on a background process to mark expiration.
- **FR-006**: System MUST allow the recipient of a pending, unexpired request to transition its status to `paid` and record a paid timestamp.
- **FR-007**: System MUST allow the recipient of a pending, unexpired request to transition its status to `declined` and record a declined timestamp.
- **FR-008**: System MUST allow the sender of a pending, unexpired request to transition its status to `cancelled` and record a cancelled timestamp.
- **FR-009**: System MUST enforce that each state transition (pay, decline, cancel) is atomic, race-safe, and rejected if the current status is not `pending` or the request is expired.
- **FR-010**: System MUST NOT permit any state transition on a request by a user who is neither its sender nor its recipient.
- **FR-011**: System MUST prevent any user from reading a request where they are neither the sender nor the recipient, except via the public share link.
- **FR-012**: System MUST render the public share page for any valid token and MUST show only the request's amount, sender display, recipient email, note, status, and expiration — no private data beyond those fields.
- **FR-013**: System MUST require email-and-password sign-in for the sender to create a request and for any user to pay, decline, or cancel.
- **FR-014**: System MUST provide a dashboard with separate Incoming and Outgoing lists, status filter, and free-text search over notes and counterparty email.
- **FR-015**: System MUST handle money as integer cents for all storage, transmission, and comparison; display of amounts is formatted as US dollars with two fractional digits.
- **FR-016**: System MUST reject a request where the recipient email equals the sender's own email.
- **FR-017**: System MUST redirect unauthenticated users who attempt to view protected pages (dashboard, create-request, internal detail) to the sign-in page.
- **FR-018**: System MUST display an accurate countdown ("expires in X days, Y hours") for every pending, unexpired request wherever it is shown.
- **FR-019**: System MUST support concurrent users acting on the same request without producing duplicate terminal states; at most one terminal transition persists.
- **FR-020**: System MUST present a clear, non-technical error message when any action is rejected due to status, expiration, or authorization.

### Key Entities *(include if feature involves data)*

- **User**: A person with an authenticated email identity. Can act as sender or recipient. Identified by a stable user id and by their verified email.
- **Payment Request**: A record that one user (sender) is asking a specific email address (recipient) for a specific integer-cent amount, with an optional note, a status drawn from {pending, paid, declined, cancelled}, a creation timestamp, a 7-day expiration, optional terminal-state timestamps (paid/declined/cancelled), and a unique public share token.
- **Public Share View**: A read-only projection of a payment request exposed via its share token, showing amount, status, note, counterparty identities (emails only), and expiration — no database identifiers or auth data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can sign up, create their first payment request, and share the link with someone else in under two minutes from a cold start.
- **SC-002**: A recipient who opens the dashboard and pays a pending request completes the transaction in three clicks or fewer.
- **SC-003**: In any race where two actions target the same pending request, at most one succeeds and the other receives a clear "already resolved" message — verified by an automated concurrency test.
- **SC-004**: No request can be paid, declined, or cancelled once its expiration has passed — verified by an automated test that advances system time past the expiration boundary.
- **SC-005**: No user can observe the existence or contents of a request where they are neither sender nor recipient through the authenticated dashboard or detail pages — verified by an automated test attempting cross-user reads.
- **SC-006**: Anyone holding a valid share link can view a request's public projection in under one second on a typical broadband connection, and cannot escalate that view into any mutation without signing in as the recipient.
- **SC-007**: Ninety-five percent of dashboard loads render the user's request list in under one second on a typical broadband connection for accounts with up to one hundred requests.
- **SC-008**: Zero monetary rounding errors appear in any displayed, stored, or transmitted amount across the full feature surface — verified by an automated check that a round-trip of any valid amount preserves its exact cent value.

## Assumptions

- Authentication is email-and-password; no magic links, SMS, or third-party OAuth in this version.
- Notifications (email, push, SMS) to the recipient are out of scope; the recipient discovers requests via their dashboard or a shared link.
- Money is single-currency US dollars; multi-currency and currency conversion are out of scope.
- Phone numbers, contact books, and social-graph features are out of scope.
- Recipient accounts do not need to pre-exist at request-creation time; a request can be addressed to an unregistered email and becomes visible to that person after they sign up with that email.
- No actual funds movement is performed — "paid" is a recorded state change, not a payment rail transaction. This matches the scope of the interview assignment.
- No background scheduler, cron job, or worker is required; expiration and other time-based states are computed at read time.
- Data retention follows industry defaults for a fintech-shaped product; purging cancelled and expired requests older than ninety days is acceptable but not implemented in this version.
- Target users are on modern browsers with stable internet; no offline mode.
- Accessibility follows standard form-control semantics and visible focus states; formal WCAG audits are out of scope for this version.

## Out of Scope

- Email, push, or SMS notifications.
- Actual money movement through a payment processor or card network.
- Reminders, recurring requests, request editing after creation, or partial payments.
- Group requests with multiple recipients.
- Multi-currency or currency conversion.
- Admin panel, audit log UI, or bulk export.
- Fraud scoring, AML/KYC, or identity verification.
