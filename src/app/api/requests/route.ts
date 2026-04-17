import { nanoid } from "nanoid";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";
import { toPaymentRequestView } from "@/lib/request-view";
import { createRequestSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid", field: "body", message: "Body must be valid JSON" },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = createRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      return NextResponse.json(
        {
          error: "invalid",
          field: String(issue.path[0] ?? "body"),
          message: issue.message,
        },
        { status: 400 },
      );
    }
    throw err;
  }

  if (parsed.recipient_email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "self_request" }, { status: 400 });
  }

  const share_link = nanoid(21);

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      sender_id: user.id,
      recipient_email: parsed.recipient_email,
      amount_cents: parsed.amount_cents,
      note: parsed.note,
      share_link,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "unknown", message: error?.message ?? "insert failed" },
      { status: 500 },
    );
  }

  const view = toPaymentRequestView(
    data,
    user.email,
    { id: user.id, email: user.email },
  );

  return NextResponse.json(view, { status: 201 });
}
