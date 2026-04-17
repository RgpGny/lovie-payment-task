import { expect, resetRequests, seedRequest, signIn, test } from "./fixtures";

test.describe("Dashboard", () => {
  test.beforeEach(resetRequests);

  test("incoming + outgoing tabs scope to the caller", async ({ page }) => {
    await seedRequest({
      from: "bob",
      to: "alice",
      amountCents: 1800,
      note: "Taxi share",
    });
    await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 2500,
      note: "Dinner",
    });

    await signIn(page, "alice");
    await page.goto("/dashboard");

    await expect(page.getByText("Taxi share")).toBeVisible();
    await expect(page.getByText("Dinner")).not.toBeVisible();

    await page.getByRole("tab", { name: "Outgoing" }).click();
    await expect(page.getByText("Dinner")).toBeVisible();
    await expect(page.getByText("Taxi share")).not.toBeVisible();
  });

  test("status filter narrows the list", async ({ page }) => {
    await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 4200,
      note: "Coffee round",
      status: "paid",
    });
    await seedRequest({
      from: "alice",
      to: "bob",
      amountCents: 1100,
      note: "Lunch",
      status: "pending",
    });

    await signIn(page, "alice");
    await page.goto("/dashboard");
    await page.getByRole("tab", { name: "Outgoing" }).click();

    await expect(page.getByText("Coffee round")).toBeVisible();
    await expect(page.getByText("Lunch")).toBeVisible();

    await page.getByLabel("Status filter").selectOption("paid");
    await expect(page.getByText("Coffee round")).toBeVisible();
    await expect(page.getByText("Lunch")).not.toBeVisible();
  });
});
