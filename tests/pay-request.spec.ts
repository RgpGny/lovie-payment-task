import { admin, expect, resetRequests, seedRequest, signIn, test } from "./fixtures";

test.describe("Pay request", () => {
  test.beforeEach(resetRequests);

  test("bob pays a pending request from alice", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 1900,
      note: "Stage 10 pay spec",
    });

    await signIn(page, "bob");
    await page.goto(`/requests/${row.id}`);

    await expect(page.getByText("$19.00")).toBeVisible();
    await page.getByTestId("pay-button").click();

    await expect(page.getByText(/^Paid/).first()).toBeVisible();

    const { data } = await admin
      .from("payment_requests")
      .select("status, paid_at")
      .eq("id", row.id)
      .single();
    expect(data?.status).toBe("paid");
    expect(data?.paid_at).not.toBeNull();
  });

  test("recipient cannot pay an already-paid request", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 700,
      note: "Already paid",
      status: "paid",
    });

    await signIn(page, "bob");
    await page.goto(`/requests/${row.id}`);

    // Already terminal — no Pay button rendered.
    await expect(page.getByTestId("pay-button")).toHaveCount(0);
    await expect(page.getByTestId("status-paid")).toBeVisible();
  });
});
