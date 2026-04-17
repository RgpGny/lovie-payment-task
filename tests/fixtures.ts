import { createClient } from "@supabase/supabase-js";
import { test as base, type Page } from "@playwright/test";
import { nanoid } from "nanoid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "tests/fixtures.ts requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. Run tests with `dotenv -e .env.local -- npx playwright test` or set the vars explicitly.",
  );
}

export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const USERS = {
  alice: { email: "alice@payrequest.test", password: "password123" },
  bob: { email: "bob@payrequest.test", password: "password123" },
} as const;

export type UserKey = keyof typeof USERS;

export async function signIn(page: Page, who: UserKey) {
  const user = USERS[who];
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function signOut(page: Page) {
  await page.goto("/dashboard");
  const button = page.getByRole("button", { name: "Sign out" });
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    await page.waitForURL("**/login");
  }
}

export async function resetRequests() {
  await admin.from("payment_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

export type SeedArgs = {
  from: UserKey;
  to: UserKey;
  amountCents: number;
  note?: string | null;
  status?: "pending" | "paid" | "declined" | "cancelled";
  expiresInSeconds?: number;
  shareLink?: string;
};

export async function seedRequest(args: SeedArgs) {
  const sender = USERS[args.from];
  const recipient = USERS[args.to];

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", sender.email)
    .single();
  if (profileErr || !profile) {
    throw new Error(
      `seedRequest: couldn't find profile for ${sender.email}: ${profileErr?.message ?? "not found"}`,
    );
  }

  const shareLink = args.shareLink ?? nanoid(21);
  const status = args.status ?? "pending";
  const expiresInSeconds = args.expiresInSeconds ?? 7 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const row: Record<string, unknown> = {
    sender_id: profile.id,
    recipient_email: recipient.email,
    amount_cents: args.amountCents,
    note: args.note ?? null,
    status,
    share_link: shareLink,
    expires_at: expiresAt,
  };
  if (status === "paid") row.paid_at = new Date().toISOString();
  if (status === "declined") row.declined_at = new Date().toISOString();
  if (status === "cancelled") row.cancelled_at = new Date().toISOString();

  const { data, error } = await admin
    .from("payment_requests")
    .insert(row)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`seedRequest failed: ${error?.message ?? "no row returned"}`);
  }

  return data;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
  },
});

export { expect } from "@playwright/test";
