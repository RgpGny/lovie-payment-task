import { admin, expect, resetRequests, seedRequest, signIn, test } from "./fixtures";

test.describe("Cancel request", () => {
  test.beforeEach(resetRequests);

  test("alice cancels her own pending request", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 5500,
      note: "Stage 10 cancel spec",
    });

    await signIn(page, "alice");
    await page.goto(`/requests/${row.id}`);

    await page.getByTestId("cancel-button").click();
    await expect(page.getByTestId("status-cancelled")).toBeVisible();

    const { data } = await admin
      .from("payment_requests")
      .select("status, cancelled_at")
      .eq("id", row.id)
      .single();
    expect(data?.status).toBe("cancelled");
    expect(data?.cancelled_at).not.toBeNull();
  });

  test("bob has no cancel button on a request he received", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 800,
      note: "Bob can't cancel",
    });

    await signIn(page, "bob");
    await page.goto(`/requests/${row.id}`);

    await expect(page.getByTestId("cancel-button")).toHaveCount(0);
    // He should still see pay and decline.
    await expect(page.getByTestId("pay-button")).toBeVisible();
    await expect(page.getByTestId("decline-button")).toBeVisible();
  });
});
