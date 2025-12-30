import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: "webkit",
});

test("verify content safe area padding", async ({ page }) => {
  // Go to the local app (assuming it will be running on 4173 for preview)
  await page.goto("http://localhost:4173");

  const content = page.locator(".content");

  // Evaluate the computed style
  const paddingTop = await content.evaluate((el) => {
    return window.getComputedStyle(el).paddingTop;
  });

  const paddingBottom = await content.evaluate((el) => {
    return window.getComputedStyle(el).paddingBottom;
  });

  console.log("Computed Padding Top:", paddingTop);
  console.log("Computed Padding Bottom:", paddingBottom);

  // env(safe-area-inset-top) is usually 0 in headless unless emulated correctly.
  // Playwright's mobile emulation should set it.
  // iPhone 12 Pro: Top 47px, Bottom 34px.

  // Current CSS: calc(env(safe-area-inset-top) + 12px)
  // Expected Layout if "only 0 padding" implies "only safe area":
  // Top should not have the +12px.
});
