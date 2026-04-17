import { admin, expect, resetRequests, signIn, test } from "./fixtures";

test.describe("Create request flow", () => {
  test.beforeEach(resetRequests);

  test("alice creates a request to bob and lands on the success page", async ({
    page,
  }) => {
    await signIn(page, "alice");
    await page.goto("/requests/new");

    await page.getByLabel("Recipient email").fill("bob@payrequest.test");
    await page.getByLabel("Amount (USD)").fill("42.50");
    await page.getByLabel("Note (optional)").fill("Pizza last night");
    await page.getByRole("button", { name: "Send request" }).click();

    await page.waitForURL(/\/requests\/[0-9a-f-]+\/success$/);
    await expect(page.getByText("Request sent")).toBeVisible();
    await expect(page.getByText("$42.50 from bob@payrequest.test")).toBeVisible();

    const { data: rows, error } = await admin
      .from("payment_requests")
      .select("amount_cents, recipient_email, status, note")
      .eq("recipient_email", "bob@payrequest.test");
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows![0].amount_cents).toBe(4250);
    expect(rows![0].status).toBe("pending");
    expect(rows![0].note).toBe("Pizza last night");
  });

  test("invalid email is rejected client-side", async ({ page }) => {
    await signIn(page, "alice");
    await page.goto("/requests/new");
    await page.getByLabel("Recipient email").fill("not-an-email");
    await page.getByLabel("Amount (USD)").fill("10.00");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
  });

  test("self-request is rejected", async ({ page }) => {
    await signIn(page, "alice");
    await page.goto("/requests/new");
    await page.getByLabel("Recipient email").fill("alice@payrequest.test");
    await page.getByLabel("Amount (USD)").fill("5.00");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText(/can't request money from yourself/i)).toBeVisible();
  });
});
