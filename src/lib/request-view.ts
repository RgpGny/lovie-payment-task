import { effectiveStatus, isExpired } from "./expiration";
import type { PaymentRequestRow, PaymentRequestView, PublicRequestView } from "./types";

export function toPaymentRequestView(
  row: PaymentRequestRow,
  sender_email: string,
  viewer: { id: string; email: string } | null,
  now: Date = new Date(),
): PaymentRequestView {
  return {
    ...row,
    sender_email,
    is_expired: isExpired(row.expires_at, now),
    effective_status: effectiveStatus(row.status, row.expires_at, now),
    is_sender: viewer ? row.sender_id === viewer.id : false,
    is_recipient: viewer
      ? row.recipient_email.toLowerCase() === viewer.email.toLowerCase()
      : false,
  };
}

export function toPublicRequestView(
  row: Pick<
    PaymentRequestRow,
    | "id"
    | "share_link"
    | "amount_cents"
    | "note"
    | "status"
    | "expires_at"
    | "created_at"
    | "recipient_email"
  >,
  sender_email: string,
  now: Date = new Date(),
): PublicRequestView {
  return {
    id: row.id,
    share_link: row.share_link,
    amount_cents: row.amount_cents,
    note: row.note,
    status: row.status,
    effective_status: effectiveStatus(row.status, row.expires_at, now),
    is_expired: isExpired(row.expires_at, now),
    expires_at: row.expires_at,
    created_at: row.created_at,
    sender_email,
    recipient_email: row.recipient_email,
  };
}
