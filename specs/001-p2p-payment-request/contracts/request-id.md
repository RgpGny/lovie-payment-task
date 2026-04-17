# Contract — `GET /api/requests/[id]`

**Auth**: Required. Caller must be sender or recipient of the row (enforced by RLS).

**Path params**:

- `id` — UUID.

**Behavior**: `SELECT * FROM payment_requests WHERE id = $1`. RLS filters by `sender_id = auth.uid() OR recipient_email = auth.email()`; so callers with no relationship to the row receive zero rows, which the handler returns as 404.

**Response shape** (`PaymentRequestView`):

```ts
{
  id:              string,
  share_link:      string,
  sender_id:       string,
  sender_email:    string,  // joined from profiles
  recipient_email: string,
  amount_cents:    number,
  note:            string | null,
  status:          'pending' | 'paid' | 'declined' | 'cancelled',
  effective_status:'pending' | 'paid' | 'declined' | 'cancelled' | 'expired',
  is_expired:      boolean,
  created_at:      string, // ISO
  expires_at:      string, // ISO
  paid_at:         string | null,
  declined_at:     string | null,
  cancelled_at:    string | null,
  is_sender:       boolean,
  is_recipient:    boolean
}
```

| Status | Body                             | When                                                                  |
|--------|----------------------------------|-----------------------------------------------------------------------|
| 200    | `PaymentRequestView`             | Success                                                               |
| 401    | `{ error: "unauthenticated" }`   | No session                                                            |
| 404    | `{ error: "not_found" }`         | Row does not exist OR caller not involved (RLS filtered it out)       |
