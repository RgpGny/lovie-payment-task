import { NextResponse, type NextRequest } from "next/server";

import { toPaymentRequestView } from "@/lib/request-view";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
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

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", data.sender_id)
    .maybeSingle();

  const view = toPaymentRequestView(
    data,
    senderProfile?.email ?? "",
    { id: user.id, email: user.email },
  );

  return NextResponse.json(view, { status: 200 });
}
