# Contract — `POST /api/requests/[id]/pay`

**Auth**: Required. Caller must be the recipient (`recipient_email = auth.email()`).

**Path params**: `id` (UUID).

**Request body**: Empty.

**Behavior** — single atomic UPDATE:

```sql
UPDATE payment_requests
   SET status = 'paid', paid_at = now()
 WHERE id = $1
   AND status = 'pending'
   AND expires_at > now()
   AND recipient_email = auth.email()
 RETURNING *;
```

Rows affected:

- `1`: the request just transitioned. Return `200 OK` with the updated `PaymentRequestView`.
- `0`: one of {not the recipient, not pending, already expired}. Disambiguate with a single follow-up `SELECT status, expires_at FROM payment_requests WHERE id = $1` under RLS; map the result to one of the 409 bodies below.

**Responses**:

| Status | Body                                                             | When                                                                        |
|--------|------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 200    | `PaymentRequestView` (status = paid)                             | Update affected 1 row                                                       |
| 401    | `{ error: "unauthenticated" }`                                   | No session                                                                  |
| 404    | `{ error: "not_found" }`                                         | No row visible to the caller with this id                                   |
| 409    | `{ error: "not_pending", current_status: "paid" | "declined" | "cancelled" }` | Row is no longer pending                                                    |
| 409    | `{ error: "expired" }`                                           | Row is still pending but `now() >= expires_at`                              |
| 403    | `{ error: "not_recipient" }`                                     | Caller is involved but as sender, not recipient                             |

**Concurrency note**: Two simultaneous pay attempts both issue the same UPDATE. Postgres serialises them; the second one matches zero rows (status is no longer `pending`) and falls to the 409 branch.
