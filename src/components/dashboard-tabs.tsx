"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequestCard } from "@/components/request-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentRequestView } from "@/lib/types";

type Direction = "incoming" | "outgoing";
type StatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "declined"
  | "cancelled"
  | "expired";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export function DashboardTabs() {
  const [direction, setDirection] = useState<Direction>("incoming");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PaymentRequestView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({ direction, status });
      if (q.trim()) searchParams.set("q", q.trim());
      const response = await fetch(`/api/requests?${searchParams.toString()}`);
      if (!response.ok) {
        toast.error("Couldn't load requests");
        return;
      }
      const payload = (await response.json()) as { items: PaymentRequestView[] };
      setItems(payload.items);
    } finally {
      setLoading(false);
    }
  }, [direction, status, q]);

  useEffect(() => {
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <Tabs
      value={direction}
      onValueChange={(v) => setDirection(v as Direction)}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="incoming">Incoming</TabsTrigger>
        <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
      </TabsList>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Status filter"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Input
          type="search"
          placeholder="Search note or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <TabsContent value="incoming" className="space-y-3">
        <List
          loading={loading}
          items={items}
          direction="incoming"
          emptyLabel="No incoming requests yet."
        />
      </TabsContent>
      <TabsContent value="outgoing" className="space-y-3">
        <List
          loading={loading}
          items={items}
          direction="outgoing"
          emptyLabel="No outgoing requests yet. Ask someone for money."
        />
      </TabsContent>
    </Tabs>
  );
}

function List({
  loading,
  items,
  direction,
  emptyLabel,
}: {
  loading: boolean;
  items: PaymentRequestView[];
  direction: Direction;
  emptyLabel: string;
}) {
  if (loading && items.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return items.map((item) => (
    <RequestCard key={item.id} request={item} direction={direction} />
  ));
}
