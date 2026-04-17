"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PayShareActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "pay" | "decline") {
    startTransition(async () => {
      const response = await fetch(`/api/requests/${id}/${action}`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success(action === "pay" ? "Payment recorded" : "Request declined");
        router.refresh();
        return;
      }
      const payload = await response.json().catch(() => null);
      const code = payload?.error as string | undefined;
      if (code === "expired") toast.error("This request has expired");
      else if (code === "not_pending")
        toast.error(`Already ${payload?.current_status ?? "resolved"}`);
      else if (code === "not_recipient")
        toast.error("Only the recipient can pay or decline");
      else if (code === "unauthenticated") router.replace("/login");
      else
        toast.error("Couldn't update the request", {
          description: payload?.message ?? "Unexpected error",
        });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => act("pay")}
        disabled={pending}
        data-testid="share-pay-button"
      >
        {pending ? "Paying…" : "Pay"}
      </Button>
      <Button
        variant="outline"
        onClick={() => act("decline")}
        disabled={pending}
        data-testid="share-decline-button"
      >
        {pending ? "Declining…" : "Decline"}
      </Button>
    </div>
  );
}
