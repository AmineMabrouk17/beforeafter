// auth.setup.ts — log in the DEMO user once, reuse session for all screenshot specs.
// Per-repo adaptation: adjust selectors + login URL to your app's login form.
// Requires env: E2E_BASE_URL, E2E_USER, E2E_PASS. Run via Playwright project "setup".
import { test as setup, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL!;
const USER = process.env.E2E_USER!;
const PASS = process.env.E2E_PASS!;
const authFile = "e2e/.auth/user.json";

setup("authenticate as demo user", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  // TODO(repo): replace with your login form selectors
  await page.getByLabel(/email/i).fill(USER);
  await page.getByLabel(/password/i).fill(PASS);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  // TODO(repo): replace with a post-login assertion for your app
  await expect(page).toHaveURL(/\/(app|home)/, { timeout: 15000 });
  await page.context().storageState({ path: authFile });
});
