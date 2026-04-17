import Link from "next/link";
import { notFound } from "next/navigation";

import { PayShareActions } from "@/components/pay-share-actions";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountdown } from "@/lib/expiration";
import { formatCents } from "@/lib/money";
import { toPublicRequestView } from "@/lib/request-view";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { PublicRequestView } from "@/lib/types";

export default async function PayShareLinkPage({
  params,
}: {
  params: Promise<{ link: string }>;
}) {
  const { link } = await params;

  const service = createServiceRoleClient();

  const { data, error } = await service
    .from("payment_requests")
    .select(
      "id, share_link, sender_id, amount_cents, note, status, expires_at, created_at, recipient_email",
    )
    .eq("share_link", link)
    .maybeSingle();

  if (error || !data) notFound();

  const { data: sender } = await service
    .from("profiles")
    .select("email")
    .eq("id", data.sender_id)
    .maybeSingle();

  const view = toPublicRequestView(data, sender?.email ?? "");

  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  const isRecipient =
    !!user?.email &&
    user.email.toLowerCase() === view.recipient_email.toLowerCase();

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-muted-foreground underline underline-offset-4"
        >
          PayRequest
        </Link>
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold">
              {formatCents(view.amount_cents)}
            </CardTitle>
            <StatusBadge status={view.effective_status} />
          </div>
          <p className="text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">{view.sender_email}</span>
            {" → "}
            <span className="font-medium text-foreground">
              {view.recipient_email}
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {view.note ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Note: </span>
              {view.note}
            </p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {view.effective_status === "pending"
              ? formatCountdown(view.expires_at)
              : `Status: ${view.effective_status}`}
          </p>

          <PublicFooter view={view} signedInAs={user?.email ?? null} />

          {view.effective_status === "pending" && isRecipient ? (
            <PayShareActions id={view.id} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function PublicFooter({
  view,
  signedInAs,
}: {
  view: PublicRequestView;
  signedInAs: string | null;
}) {
  if (view.effective_status !== "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        {`This request is ${view.effective_status} and can't be changed.`}
      </p>

    );
  }

  if (!signedInAs) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as{" "}
        <span className="font-medium text-foreground">{view.recipient_email}</span>{" "}
        to pay this request.{" "}
        <Link
          className="font-medium text-foreground underline"
          href={`/login?next=/pay/${view.share_link}`}
        >
          Sign in
        </Link>
      </p>
    );
  }

  if (signedInAs.toLowerCase() !== view.recipient_email.toLowerCase()) {
    return (
      <p className="text-sm text-muted-foreground">
        You&apos;re signed in as{" "}
        <span className="font-medium text-foreground">{signedInAs}</span>, but this
        request was addressed to {view.recipient_email}. You can view it, but only{" "}
        {view.recipient_email} can pay or decline.
      </p>
    );
  }

  return null;
}
