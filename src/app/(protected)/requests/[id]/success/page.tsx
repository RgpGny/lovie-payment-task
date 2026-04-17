import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CopyLinkButton } from "@/components/copy-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountdown } from "@/lib/expiration";
import { formatCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export default async function RequestSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=/requests/${id}/success`);

  const { data, error } = await supabase
    .from("payment_requests")
    .select("id, share_link, recipient_email, amount_cents, note, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Request sent</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {formatCents(data.amount_cents)} from {data.recipient_email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.note ? (
            <p className="text-sm text-muted-foreground">“{data.note}”</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {formatCountdown(data.expires_at)}.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Shareable link</p>
            <CopyLinkButton shareLink={data.share_link} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
