import { admin, expect, resetRequests, seedRequest, signIn, signOut, test } from "./fixtures";

test.describe("Shareable link", () => {
  test.beforeEach(resetRequests);

  test("anon can view the public page but not the pay button", async ({
    page,
  }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 3300,
      note: "Stage 10 share anon",
      shareLink: "stage10_share_anon_probe",
    });

    await page.goto(`/pay/${row.share_link}`);
    await expect(page.getByText("$33.00")).toBeVisible();
    await expect(page.getByText(/Sign in as/)).toBeVisible();
    await expect(page.getByTestId("share-pay-button")).toHaveCount(0);
  });

  test("signed-in recipient can pay from the share page", async ({ page }) => {
    const row = await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 2100,
      note: "Stage 10 share recipient",
      shareLink: "stage10_share_recipient_probe",
    });

    await signIn(page, "bob");
    await page.goto(`/pay/${row.share_link}`);

    await expect(page.getByTestId("share-pay-button")).toBeVisible();
    await page.getByTestId("share-pay-button").click();
    await expect(page.getByTestId("status-paid")).toBeVisible();

    const { data } = await admin
      .from("payment_requests")
      .select("status, paid_at")
      .eq("id", row.id)
      .single();
    expect(data?.status).toBe("paid");
    expect(data?.paid_at).not.toBeNull();
  });

  test("signed-in non-recipient sees view but not pay button", async ({ page }) => {
    const row = await seedRequest({
      from: "bob",
      to: "alice",
      amountCents: 1400,
      note: "Stage 10 share wrong user",
      shareLink: "stage10_share_wrong_user",
    });

    await signIn(page, "bob"); // bob is the SENDER here, not the recipient.
    await page.goto(`/pay/${row.share_link}`);

    await expect(page.getByText("$14.00")).toBeVisible();
    await expect(page.getByTestId("share-pay-button")).toHaveCount(0);
    await expect(page.getByText(/addressed to alice@payrequest.test/)).toBeVisible();

    // Make sure signOut helper still works for cleanup between tests.
    await signOut(page);
  });
});
