import { admin, expect, resetRequests, seedRequest, signIn, test } from "./fixtures";

test.describe("Expiration", () => {
  test.beforeEach(resetRequests);

  test("expired pending request renders as Expired and has no pay button", async ({
    page,
  }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 550,
      note: "Expired probe",
      expiresInSeconds: -5, // already past expiry
    });

    await signIn(page, "bob");
    await page.goto(`/requests/${row.id}`);

    await expect(page.getByTestId("status-expired")).toBeVisible();
    await expect(page.getByTestId("pay-button")).toHaveCount(0);
    await expect(page.getByTestId("decline-button")).toHaveCount(0);
  });

  test("pay API refuses an expired row with 409 expired", async ({
    page,
  }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 1000,
      note: "Late-pay probe",
      expiresInSeconds: -5,
    });

    // Log in via the browser first. page.request shares cookies with the page.
    await signIn(page, "bob");
    const response = await page.request.post(`/api/requests/${row.id}/pay`);
    expect(response.status()).toBe(409);
    const payload = await response.json();
    expect(payload.error).toBe("expired");

    // DB row is still pending (never transitioned).
    const { data } = await admin
      .from("payment_requests")
      .select("status")
      .eq("id", row.id)
      .single();
    expect(data?.status).toBe("pending");
  });
});
