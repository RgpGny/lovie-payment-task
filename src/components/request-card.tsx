import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCountdown } from "@/lib/expiration";
import { formatCents } from "@/lib/money";
import type { PaymentRequestView } from "@/lib/types";

export function RequestCard({
  request,
  direction,
}: {
  request: PaymentRequestView;
  direction: "incoming" | "outgoing";
}) {
  const counterparty =
    direction === "incoming" ? request.sender_email : request.recipient_email;

  return (
    <Link
      href={`/requests/${request.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="transition-colors hover:border-foreground/30">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{counterparty}</span>
              <StatusBadge status={request.effective_status} />
            </div>
            {request.note ? (
              <p className="truncate text-sm text-muted-foreground">
                {request.note}
              </p>
            ) : null}
            {request.effective_status === "pending" ? (
              <p className="text-xs text-muted-foreground">
                {formatCountdown(request.expires_at)}
              </p>
            ) : null}
          </div>
          <div className="whitespace-nowrap text-right text-lg font-semibold tabular-nums">
            {formatCents(request.amount_cents)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
