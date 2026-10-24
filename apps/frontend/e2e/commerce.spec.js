import { test, expect } from "@playwright/test";

test("three-language shop, isolated test order, admin fulfillment and support", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://**/*", (route) => route.fulfill({ body: "" }));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Testga kirish", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Testga kirish", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".avatar")).toHaveText("D");
  await page.locator("header select").selectOption("en");
  await expect(
    page.getByRole("heading", { name: "Your game. Next level." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore shop", exact: true }).click();
  await page.getByRole("button", { name: /172 diamonds/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("User ID", { exact: true }).fill("123456789");
  await dialog.getByLabel("Zone ID", { exact: true }).fill("1234");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Create test order", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Confirm test payment", exact: true })
    .click();
  await expect(page.locator(".order-card .status")).toHaveText("Test paid");
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.route("https://**/*", (route) => route.fulfill({ body: "" }));
  await admin.goto("/admin");
  await admin.locator("header select").selectOption("en");
  await admin
    .getByLabel("Admin key", { exact: true })
    .fill(
      process.env.E2E_ADMIN_KEY || "local-e2e-admin-key-for-tests-only-123456",
    );
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await admin.getByRole("button", { name: "Orders", exact: true }).click();
  const card = admin.locator(".order-card").first();
  await card
    .getByRole("button", { name: "Test processing", exact: true })
    .click();
  await card
    .getByRole("button", { name: "Test completed", exact: true })
    .click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".order-card .status")).toHaveText(
    "Test completed",
  );
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Support", exact: true })
    .click();
  const message = "E2E support " + Date.now();
  await page.getByLabel("Your message", { exact: true }).fill(message);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.locator(".ticket").filter({ hasText: message }),
  ).toBeVisible();
  await admin.getByRole("button", { name: "Support", exact: true }).click();
  const ticket = admin.locator(".ticket").filter({ hasText: message });
  await ticket.getByLabel("Write a reply").fill("Test reply");
  await ticket.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText("Test reply", { exact: true })).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page.getByLabel("User ID", { exact: true }).fill("987654321");
  await page.getByLabel("Zone ID", { exact: true }).fill("4321");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await expect(page.getByLabel("User ID", { exact: true })).toHaveValue(
    "987654321",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("header select").selectOption("ru");
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Магазин", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Магазин", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-shop.png",
    fullPage: true,
  });
  await page.locator("header select").selectOption("uz");
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Bosh sahifa", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O‘yiningiz. Yangi bosqich." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await adminContext.close();
});
