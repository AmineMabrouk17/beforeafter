// shots.spec.ts — capture docs/shots/<screen>-after-#<pr>.png with the demo session.
// Per-repo adaptation (3 things only):
//   1. SCREENS: list the screens your PRs touch (name, path, ready-selector).
//   2. StorageState path from auth.setup.ts (or the repo's native preview bypass).
//   3. If your repo ships a per-PR capture pipeline + capture-map (screen list is
//      derived from the branch ref), put that logic in capture-map and DRIVE it —
//      don't duplicate SCREENS here.
// Naming is contractual: {screen}-after-#{prNumber}.png ↔ beforeafter skill maps
// each PR's shots by number. {prNumber} and {headOid} come from env.
// Optimisation: if the shot already exists for the SAME headOid in CAPTURE_SUFFIX,
// the PR is skipped (nothing changed since last capture → ~instant re-runs).
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL!;
const PR_NUM = process.env.PR_NUM ?? "0";
const HEAD_OID = process.env.HEAD_OID ?? "";
const SHOTS_DIR = process.env.SHOTS_DIR ?? "docs/shots";
const CAPTURE_SUFFIX = process.env.CAPTURE_SUFFIX ?? `after-#${PR_NUM}`;

// TODO(repo): list the screens your issues touch + the selector that proves load
const SCREENS: Array<{ name: string; path: string; ready: string }> = [
  { name: "home", path: "/", ready: "main" },
  { name: "app", path: "/app", ready: "main" },
];

const fs = require("node:fs");
const path = require("node:path");

test.use({ storageState: "e2e/.auth/user.json" });

for (const s of SCREENS) {
  test(`shot: ${s.name}${PR_NUM !== "0" ? ` (PR #${PR_NUM})` : ""}`, async ({ page }) => {
    const outJson = path.join(SHOTS_DIR, `${s.name}-${CAPTURE_SUFFIX}.json`);
    if (HEAD_OID && fs.existsSync(outJson)) {
      const prev = JSON.parse(fs.readFileSync(outJson, "utf8"));
      if (prev.headOid === HEAD_OID) {
        console.log(`skip ${s.name}: head ${HEAD_OID} already captured`);
        return;
      }
    }
    await page.goto(`${BASE}${s.path}`);
    await page.locator(s.ready).first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(SHOTS_DIR, `${s.name}-${CAPTURE_SUFFIX}.png`), fullPage: false });
    fs.writeFileSync(outJson, JSON.stringify({ headOid: HEAD_OID, pr: PR_NUM, screen: s.name }));
    expect(true).toBe(true);
  });
}