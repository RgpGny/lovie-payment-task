import type { Database } from "./supabase/database.types";

export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type EffectiveStatus = RequestStatus | "expired";

export type PaymentRequestRow = Database["public"]["Tables"]["payment_requests"]["Row"];

export type PaymentRequestView = PaymentRequestRow & {
  sender_email: string;
  effective_status: EffectiveStatus;
  is_expired: boolean;
  is_sender: boolean;
  is_recipient: boolean;
};

export type PublicRequestView = {
  id: string;
  share_link: string;
  amount_cents: number;
  note: string | null;
  status: RequestStatus;
  effective_status: EffectiveStatus;
  is_expired: boolean;
  expires_at: string;
  created_at: string;
  sender_email: string;
  recipient_email: string;
};
