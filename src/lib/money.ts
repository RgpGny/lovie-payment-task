export const MAX_AMOUNT_CENTS = 99_999_999;

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

export function dollarsToCents(input: string | number): number | null {
  const raw = typeof input === "number" ? String(input) : input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const [dollars, fraction = ""] = raw.split(".");
  const cents = Number(dollars) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isFinite(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}

export function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}
