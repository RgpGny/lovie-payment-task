import { Badge } from "@/components/ui/badge";
import type { EffectiveStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<EffectiveStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

const CLASSES: Record<EffectiveStatus, string> = {
  pending: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  declined: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-100",
  expired: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
};

export function StatusBadge({ status }: { status: EffectiveStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", CLASSES[status])}
      data-testid={`status-${status}`}
    >
      {LABELS[status]}
    </Badge>
  );
}
