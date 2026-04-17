import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RequestDetail } from "@/components/request-detail";
import { toPaymentRequestView } from "@/lib/request-view";
import { createClient } from "@/lib/supabase/server";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=/requests/${id}`);

  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

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

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Request</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
      <RequestDetail initialRequest={view} />
    </div>
  );
}
