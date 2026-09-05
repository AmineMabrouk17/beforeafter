#!/usr/bin/env node
// auth-bypass-guard.mjs — enforce the "one seam" rule so preview capture never
// needs a patch script. Fails (exit 1) when:
//   1. `supabase.auth.getUser(` appears anywhere OUTSIDE the central session
//      module (default lib/supabase/server.ts) — inline session resolution.
//   2. `getPreviewMockSession` (or equivalent bypass symbol) is referenced
//      outside the bypass module and the central server module.
//
// This is the test behind the SKILL.md rule: "if capture requires patching
// lib/*, the seam is wrong — fix the repo once, not the run every time."
// Once this guard is green, capture-time patching can be deleted entirely.
//
// Usage:
//   node auth-bypass-guard.mjs [--root .] [--seam lib/supabase/server.ts] \
//       [--bypass lib/auth/preview-bypass.ts]
// Add it to your CI / package.json test script.

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.argv.includes("--root")
  ? process.argv[process.argv.indexOf("--root") + 1]
  : ".");
const SEAM = path.join(ROOT, process.argv.includes("--seam")
  ? process.argv[process.argv.indexOf("--seam") + 1]
  : "lib/supabase/server.ts");
const BYPASS = path.join(ROOT, process.argv.includes("--bypass")
  ? process.argv[process.argv.indexOf("--bypass") + 1]
  : "lib/auth/preview-bypass.ts");

const INLINE_SESSION = /supabase\.auth\.getUser\(/;
const BYPASS_REF = /getPreviewMockSession/;

const SKIP = new Set([
  "node_modules", ".next", ".vercel", ".git", ".tmp", ".turbo",
  "BudgetIQ-Flows.html", "pnpm-lock.yaml", "package-lock.json", "yarn.lock",
]);

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) out = out.concat(walk(p));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

const errors = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");
  if (INLINE_SESSION.test(src) && path.resolve(file) !== SEAM) {
    const lines = src.split("\n");
    const at = lines.findIndex((l) => INLINE_SESSION.test(l));
    errors.push(`${rel}:${at + 1}: inline supabase.auth.getUser() outside the central seam (${path.relative(ROOT, SEAM)})`);
  }
  if (BYPASS_REF.test(src) &&
      path.resolve(file) !== SEAM &&
      path.resolve(file) !== BYPASS) {
    errors.push(`${rel}: bypass referenced outside (server seam / bypass module)`);
  }
}

if (errors.length) {
  console.error(`auth-bypass-guard: ${errors.length} violation(s)\n` + errors.join("\n"));
  process.exit(1);
}
console.log("auth-bypass-guard: one-seam rule holds — capture needs no source patches.");