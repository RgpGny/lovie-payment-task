import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { toPaymentRequestView } from "./request-view";
import type { Database } from "./supabase/database.types";

export type TransitionAction = "pay" | "decline" | "cancel";

const COLUMN_MAP: Record<TransitionAction, { status: "paid" | "declined" | "cancelled"; terminalAt: "paid_at" | "declined_at" | "cancelled_at" }> = {
  pay: { status: "paid", terminalAt: "paid_at" },
  decline: { status: "declined", terminalAt: "declined_at" },
  cancel: { status: "cancelled", terminalAt: "cancelled_at" },
};

export async function runTransition(
  supabase: SupabaseClient<Database>,
  id: string,
  action: TransitionAction,
  actor: { id: string; email: string },
) {
  const { status: newStatus, terminalAt } = COLUMN_MAP[action];
  const nowIso = new Date().toISOString();

  // Build the update payload with the correct terminal-at column.
  const updatePayload =
    action === "pay"
      ? { status: newStatus, paid_at: nowIso }
      : action === "decline"
        ? { status: newStatus, declined_at: nowIso }
        : { status: newStatus, cancelled_at: nowIso };

  let updateQuery = supabase
    .from("payment_requests")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", "pending")
    .gt("expires_at", nowIso);

  // Actor constraint mirrors the RLS policy but also discriminates sender vs recipient.
  if (action === "cancel") {
    updateQuery = updateQuery.eq("sender_id", actor.id);
  } else {
    updateQuery = updateQuery.eq("recipient_email", actor.email);
  }

  const { data: updated, error } = await updateQuery.select().maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "unknown", message: error.message },
      { status: 500 },
    );
  }

  if (updated) {
    // Get sender_email for the response view.
    const { data: sender } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", updated.sender_id)
      .maybeSingle();
    const view = toPaymentRequestView(
      updated,
      sender?.email ?? "",
      actor,
    );
    return NextResponse.json(view, { status: 200 });
  }

  // Zero rows — disambiguate. A follow-up SELECT is still subject to RLS, so
  // rows the actor can't see come back as null (→ 404).
  const { data: current } = await supabase
    .from("payment_requests")
    .select("status, expires_at, sender_id, recipient_email")
    .eq("id", id)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Actor role mismatch (you're involved but on the wrong side).
  if (action === "cancel" && current.sender_id !== actor.id) {
    return NextResponse.json({ error: "not_sender" }, { status: 403 });
  }
  if (
    action !== "cancel" &&
    current.recipient_email.toLowerCase() !== actor.email.toLowerCase()
  ) {
    return NextResponse.json({ error: "not_recipient" }, { status: 403 });
  }

  if (current.status !== "pending") {
    return NextResponse.json(
      { error: "not_pending", current_status: current.status },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: "expired" }, { status: 409 });
}

export async function authenticateForTransition(
  supabase: SupabaseClient<Database>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return {
      error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
      actor: null as null,
    };
  }
  return { error: null, actor: { id: user.id, email: user.email } };
}
