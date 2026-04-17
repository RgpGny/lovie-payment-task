import { nanoid } from "nanoid";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { toPaymentRequestView } from "@/lib/request-view";
import { createClient } from "@/lib/supabase/server";
import type { PaymentRequestView } from "@/lib/types";
import { createRequestSchema, dashboardQuerySchema } from "@/lib/validators";

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

  const view = toPaymentRequestView(data, user.email, {
    id: user.id,
    email: user.email,
  });

  return NextResponse.json(view, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  let query;
  try {
    query = dashboardQuerySchema.parse(params);
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      return NextResponse.json(
        {
          error: "invalid",
          field: String(issue.path[0] ?? "query"),
          message: issue.message,
        },
        { status: 400 },
      );
    }
    throw err;
  }

  let supaQuery = supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (query.direction === "outgoing") {
    supaQuery = supaQuery.eq("sender_id", user.id);
  } else {
    supaQuery = supaQuery.eq("recipient_email", user.email);
  }

  if (query.status !== "all" && query.status !== "expired") {
    supaQuery = supaQuery.eq("status", query.status);
  }

  if (query.q) {
    const needle = `%${query.q}%`;
    supaQuery = supaQuery.or(
      `note.ilike.${needle},recipient_email.ilike.${needle}`,
    );
  }

  const { data, error } = await supaQuery;
  if (error) {
    return NextResponse.json(
      { error: "unknown", message: error.message },
      { status: 500 },
    );
  }

  const senderIds = Array.from(new Set((data ?? []).map((r) => r.sender_id)));
  let senderEmails = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", senderIds);
    senderEmails = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  }

  const now = new Date();
  let items: PaymentRequestView[] = (data ?? []).map((row) =>
    toPaymentRequestView(
      row,
      senderEmails.get(row.sender_id) ?? "",
      { id: user.id, email: user.email! },
      now,
    ),
  );

  if (query.status === "expired") {
    items = items.filter((item) => item.effective_status === "expired");
  } else if (query.status === "all") {
    // keep everything
  } else if (query.status === "pending") {
    // "pending" filter intentionally excludes expired items
    items = items.filter((item) => item.effective_status === "pending");
  }

  return NextResponse.json({ items }, { status: 200 });
}
