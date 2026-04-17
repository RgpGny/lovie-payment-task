export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      payment_requests: {
        Row: {
          amount_cents: number;
          cancelled_at: string | null;
          created_at: string;
          declined_at: string | null;
          expires_at: string;
          id: string;
          note: string | null;
          paid_at: string | null;
          recipient_email: string;
          sender_id: string;
          share_link: string;
          status: Database["public"]["Enums"]["request_status"];
        };
        Insert: {
          amount_cents: number;
          cancelled_at?: string | null;
          created_at?: string;
          declined_at?: string | null;
          expires_at?: string;
          id?: string;
          note?: string | null;
          paid_at?: string | null;
          recipient_email: string;
          sender_id: string;
          share_link: string;
          status?: Database["public"]["Enums"]["request_status"];
        };
        Update: {
          amount_cents?: number;
          cancelled_at?: string | null;
          created_at?: string;
          declined_at?: string | null;
          expires_at?: string;
          id?: string;
          note?: string | null;
          paid_at?: string | null;
          recipient_email?: string;
          sender_id?: string;
          share_link?: string;
          status?: Database["public"]["Enums"]["request_status"];
        };
        Relationships: [
          {
            foreignKeyName: "payment_requests_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      request_status: "pending" | "paid" | "declined" | "cancelled";
    };
    CompositeTypes: Record<never, never>;
  };
};

export const REQUEST_STATUSES = ["pending", "paid", "declined", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
