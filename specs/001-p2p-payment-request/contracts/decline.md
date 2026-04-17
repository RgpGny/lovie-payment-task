# Contract — `POST /api/requests/[id]/decline`

**Auth**: Required. Caller must be the recipient.

**Path params**: `id` (UUID).

**Request body**: Empty.

**Behavior** — single atomic UPDATE:

```sql
UPDATE payment_requests
   SET status = 'declined', declined_at = now()
 WHERE id = $1
   AND status = 'pending'
   AND expires_at > now()
   AND recipient_email = auth.email()
 RETURNING *;
```

Semantics mirror `pay` — see `pay.md` for the zero-rows disambiguation and concurrency notes.

**Responses**:

| Status | Body                                                             | When                                                                        |
|--------|------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 200    | `PaymentRequestView` (status = declined)                         | Update affected 1 row                                                       |
| 401    | `{ error: "unauthenticated" }`                                   | No session                                                                  |
| 404    | `{ error: "not_found" }`                                         | No row visible to the caller with this id                                   |
| 409    | `{ error: "not_pending", current_status }`                       | Row is no longer pending                                                    |
| 409    | `{ error: "expired" }`                                           | Row is still pending but `now() >= expires_at`                              |
| 403    | `{ error: "not_recipient" }`                                     | Caller is involved but as sender                                            |
