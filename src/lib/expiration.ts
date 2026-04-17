export function isExpired(expiresAt: string | Date, now: Date = new Date()): boolean {
  const at = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return now.getTime() >= at.getTime();
}

export function formatCountdown(
  expiresAt: string | Date,
  now: Date = new Date(),
): string {
  const at = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const diffMs = at.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 1) return `expires in ${days}d ${hours}h`;
  if (hours >= 1) return `expires in ${hours}h ${minutes}m`;
  if (minutes >= 1) return `expires in ${minutes}m`;
  return "expires in <1m";
}

export type EffectiveStatus = "pending" | "paid" | "declined" | "cancelled" | "expired";

export function effectiveStatus(
  status: "pending" | "paid" | "declined" | "cancelled",
  expiresAt: string | Date,
  now: Date = new Date(),
): EffectiveStatus {
  if (status === "pending" && isExpired(expiresAt, now)) return "expired";
  return status;
}
