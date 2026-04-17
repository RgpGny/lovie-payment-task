# Contract — `GET /api/requests/share/[link]`

**Auth**: Not required. Reads go through the `public_requests` view (granted to `anon`).

**Path params**: `link` (the `share_link` token, 21 chars).

**Behavior**: `SELECT * FROM public_requests WHERE share_link = $1 LIMIT 1`. No RLS is needed because the view already projects only safe columns.

**Response shape** (`PublicRequestView`):

```ts
{
  id:              string,
  share_link:      string,
  sender_email:    string,
  recipient_email: string,
  amount_cents:    number,
  note:            string | null,
  status:          'pending' | 'paid' | 'declined' | 'cancelled',
  effective_status:'pending' | 'paid' | 'declined' | 'cancelled' | 'expired',
  is_expired:      boolean,
  created_at:      string,
  expires_at:      string
}
```

Notice the view does **not** expose `sender_id`, `paid_at`, `declined_at`, or `cancelled_at` — these are internal to the authenticated detail view.

| Status | Body                             | When                                           |
|--------|----------------------------------|------------------------------------------------|
| 200    | `PublicRequestView`              | Token matched                                  |
| 404    | `{ error: "not_found" }`         | Token doesn't match any row                    |

## Pay / decline on the share page

The public page (`/pay/[link]`) is purely informational for `anon`. When the viewer is authenticated *and* `auth.email() == recipient_email`, the page shows Pay / Decline buttons that target the internal `POST /api/requests/[id]/pay` or `.../decline` endpoints — the share endpoint itself never mutates state.
