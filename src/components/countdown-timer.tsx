"use client";

import { useEffect, useState } from "react";

import { formatCountdown, isExpired } from "@/lib/expiration";

export function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [label, setLabel] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    if (isExpired(expiresAt)) {
      setLabel("Expired");
      onExpire?.();
      return;
    }
    const tick = () => {
      if (isExpired(expiresAt)) {
        setLabel("Expired");
        onExpire?.();
        return;
      }
      setLabel(formatCountdown(expiresAt));
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  return <span className="tabular-nums">{label}</span>;
}
