// shots.spec.ts — capture docs/shots/<screen>-after.png with the demo session.
// Per-repo adaptation: adjust SCREENS to the screens each issue touches.
// Uses storageState from auth.setup.ts, so no login form runs here.
// Output paths are committed to the PR branch; PR body references them via raw URLs:
//   Before: https://raw.githubusercontent.com/<owner>/<repo>/main/docs/shots/<screen>-before.png
//   After:  https://raw.githubusercontent.com/<owner>/<repo>/<branch>/docs/shots/<screen>-after.png
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL!;

// TODO(repo): list the screens your issues touch + the selector that proves load
const SCREENS: Array<{ name: string; path: string; ready: string }> = [
  { name: "dashboard", path: "/dashboard", ready: "main" },
];

test.use({ storageState: "e2e/.auth/user.json" });

for (const s of SCREENS) {
  test(`shot: ${s.name}`, async ({ page }) => {
    await page.goto(`${BASE}${s.path}`);
    await page.locator(s.ready).first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: `docs/shots/${s.name}-after.png`, fullPage: false });
    expect(true).toBe(true);
  });
}
