import { NextResponse, type NextRequest } from "next/server";

import { toPublicRequestView } from "@/lib/request-view";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ link: string }> },
) {
  const { link } = await ctx.params;

  // Service-role read — anon callers never touch the raw tables directly.
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("payment_requests")
    .select(
      "id, share_link, sender_id, amount_cents, note, status, expires_at, created_at, recipient_email",
    )
    .eq("share_link", link)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "unknown", message: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: sender } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", data.sender_id)
    .maybeSingle();

  const view = toPublicRequestView(data, sender?.email ?? "");
  return NextResponse.json(view, { status: 200 });
}
