import { expect, resetRequests, signIn, test } from "./fixtures";

test.describe("Authentication", () => {
  test.beforeAll(resetRequests);

  test("anonymous /dashboard redirects to /login with next= preserved", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("sign-in as alice lands on /dashboard and shows her email", async ({
    page,
  }) => {
    await signIn(page, "alice");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("alice@payrequest.test")).toBeVisible();
  });

  test("wrong password shows an error toast and keeps user on /login", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("alice@payrequest.test");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Sign-in failed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
