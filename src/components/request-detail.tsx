"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { CopyLinkButton } from "@/components/copy-link-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { PaymentRequestView } from "@/lib/types";

type Action = "pay" | "decline" | "cancel";

const ACTION_LABELS: Record<Action, { verb: string; active: string; success: string }> = {
  pay: { verb: "Pay", active: "Paying…", success: "Payment recorded" },
  decline: { verb: "Decline", active: "Declining…", success: "Request declined" },
  cancel: { verb: "Cancel request", active: "Cancelling…", success: "Request cancelled" },
};

export function RequestDetail({
  initialRequest,
}: {
  initialRequest: PaymentRequestView;
}) {
  const router = useRouter();
  const [req, setReq] = useState(initialRequest);
  const [pending, startTransition] = useTransition();

  function runAction(action: Action) {
    startTransition(async () => {
      const response = await fetch(`/api/requests/${req.id}/${action}`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (response.ok && payload) {
        setReq(payload as PaymentRequestView);
        toast.success(ACTION_LABELS[action].success);
        router.refresh();
        return;
      }

      const code = payload?.error as string | undefined;
      if (code === "expired") {
        toast.error("This request has expired");
      } else if (code === "not_pending") {
        toast.error(
          `Already ${payload?.current_status ?? "resolved"} — refresh to see the current state`,
        );
      } else if (code === "not_recipient") {
        toast.error("Only the recipient can pay or decline");
      } else if (code === "not_sender") {
        toast.error("Only the sender can cancel");
      } else if (code === "unauthenticated") {
        router.replace("/login");
      } else {
        toast.error("Couldn't update the request", {
          description: payload?.message ?? "Unexpected error",
        });
      }
      router.refresh();
    });
  }

  const showRecipientActions =
    req.is_recipient && req.effective_status === "pending";
  const showSenderActions = req.is_sender && req.effective_status === "pending";

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl font-semibold">
            {formatCents(req.amount_cents)}
          </CardTitle>
          <StatusBadge status={req.effective_status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {req.is_sender ? "To " : "From "}
          <span className="font-medium text-foreground">
            {req.is_sender ? req.recipient_email : req.sender_email}
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {req.note ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Note: </span>
            {req.note}
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          {req.effective_status === "pending" ? (
            <CountdownTimer expiresAt={req.expires_at} />
          ) : (
            timestampFor(req)
          )}
        </p>

        {(showRecipientActions || showSenderActions) && (
          <div className="flex flex-wrap gap-2">
            {showRecipientActions ? (
              <>
                <Button
                  onClick={() => runAction("pay")}
                  disabled={pending}
                  data-testid="pay-button"
                >
                  {pending ? ACTION_LABELS.pay.active : ACTION_LABELS.pay.verb}
                </Button>
                <Button
                  onClick={() => runAction("decline")}
                  disabled={pending}
                  variant="outline"
                  data-testid="decline-button"
                >
                  {pending
                    ? ACTION_LABELS.decline.active
                    : ACTION_LABELS.decline.verb}
                </Button>
              </>
            ) : null}
            {showSenderActions ? (
              <Button
                onClick={() => runAction("cancel")}
                disabled={pending}
                variant="destructive"
                data-testid="cancel-button"
              >
                {pending
                  ? ACTION_LABELS.cancel.active
                  : ACTION_LABELS.cancel.verb}
              </Button>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Shareable link
          </p>
          <CopyLinkButton shareLink={req.share_link} />
        </div>
      </CardContent>
    </Card>
  );
}

function timestampFor(req: PaymentRequestView): string {
  const t =
    req.status === "paid"
      ? req.paid_at
      : req.status === "declined"
        ? req.declined_at
        : req.status === "cancelled"
          ? req.cancelled_at
          : null;
  if (!t) return `Created ${new Date(req.created_at).toLocaleString()}`;
  const verb =
    req.status === "paid"
      ? "Paid"
      : req.status === "declined"
        ? "Declined"
        : "Cancelled";
  return `${verb} ${new Date(t).toLocaleString()}`;
}
