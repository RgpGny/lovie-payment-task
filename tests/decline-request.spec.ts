import { admin, expect, resetRequests, seedRequest, signIn, test } from "./fixtures";

test.describe("Decline request", () => {
  test.beforeEach(resetRequests);

  test("bob declines a pending request from alice", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 1200,
      note: "Stage 10 decline spec",
    });

    await signIn(page, "bob");
    await page.goto(`/requests/${row.id}`);

    await page.getByTestId("decline-button").click();
    await expect(page.getByTestId("status-declined")).toBeVisible();

    const { data } = await admin
      .from("payment_requests")
      .select("status, declined_at, paid_at, cancelled_at")
      .eq("id", row.id)
      .single();
    expect(data?.status).toBe("declined");
    expect(data?.declined_at).not.toBeNull();
    expect(data?.paid_at).toBeNull();
    expect(data?.cancelled_at).toBeNull();
  });
});
