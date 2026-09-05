# Screenshot kit — per-repo adaptation checklist

Goal: **each user-facing PR gets its own before/after pair**, captured at its
**head OID**, with the repo's native preview bypass (or the generic demo user)
so no accounts are created and nothing is patched at capture time.

## One-time setup (per repo)

1. **Seeded demo user OR native preview bypass.** Prefer the repo's own bypass
   (e.g. `lib/auth/preview-bypass.ts` with an HMAC header). Only fall back to
   the demo-user login (seeded SQL/fixtures) when the repo has no bypass. Creds
   → CI secrets + local env (`E2E_USER`, `E2E_PASS`). Never commit creds.
2. **One auth seam (very important).** All sessions must resolve through ONE
   central helper (e.g. `getUser()` in `lib/supabase/server.ts`). Run
   `templates/auth-bypass-guard.mjs` in CI so inline `supabase.auth.getUser()`
   outside the seam fails the build. With this green, capture needs **zero**
   patching of `lib/*`. If your capture script currently rewrites `lib/*` at
   run time (e.g. `patch-transactions.mjs`), that is a smell — centralize the
   seam once and delete the patch.
3. **`auth.setup.ts`** — set login URL + form selectors + post-login assertion
   (skipped entirely when using a native bypass + storageState).
4. **`shots.spec.ts`** — set `SCREENS` (name, path, ready-selector). Naming is
   contractual: `{screen}-after-#{prNumber}.png`; base `{screen}-before.png` is
   committed to `main` once per screen. The spec skips a PR whose shot already
   exists for the same head OID (pass `HEAD_OID` + `CAPTURE_SUFFIX`), so
   re-runs on unchanged PRs are instant.
5. **Per-feature screens** — a `capture-map` (branch regex → screens) tells the
   beforeafter skill which shots each PR owns. Defaults: landing + dashboard;
   features add e.g. onboarding / navbar-editor.

## Per-PR capture (fast path — worktrees + parallel + OID skip)

```bash
# from repo root, one shared preview secret for the whole run
PREVIEW_TEST_SECRET=$(openssl rand -hex 32)
git fetch -q origin

gh pr list --state open --json number,headRefName,headRefOid \
  --jq '.[] | "@" + .headRefName + " " + .headRefOid + " " + (.number|tostring)' \
  | while read -r ref oid num; do
      wt=".tmp/wt/pr-$num"
      git worktree add --force --detach "$wt" "$oid"
      # overlay: bypass module + tests/visual + config ONLY (never rewrite lib/*)
      cp lib/auth/preview-bypass.ts tests/visual/visual.spec.ts visual.config.ts "$wt/..."
      ln -sfn "$PWD/node_modules" "$wt/node_modules"
      ( cd "$wt" && E2E_BASE_URL=<url> HEAD_OID="$oid" PR_NUM="$num" \
          CAPTURE_SUFFIX="after-#$num" pnpm exec playwright test shots.spec.ts )
      git worktree remove "$wt" --force
    done
trap 'git worktree prune; rm -rf .tmp/wt' EXIT   # cleanup even on failure
```

For many PRs use bounded parallel builds (3 worktrees, one dev-server port
each, `wait` between batches — e.g. `--parallel` in
`scripts/visual/capture-before-after.sh`).

## Publishing to each PR (idempotent)

```bash
node scripts/visual/publish-shots.mjs --all
```

Posts/updates a "before/after screenshots" comment per PR with raw image URLs
(no login needed to view). If the repo has no publish script, reference the
shots in the PR body with `raw.githubusercontent.com` URLs.

output paths are committed to the PR branch; PR body references them via raw URLs:
- Before: `https://raw.githubusercontent.com/<owner>/<repo>/main/docs/shots/<screen>-before.png`
- After:  `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/docs/shots/<screen>-after-#<num>.png`

No-auth pages: skip the demo user/bypass, screenshot the preview directly, same paths.

## Guarding the seam in CI

```bash
node templates/auth-bypass-guard.mjs --root . --seam lib/supabase/server.ts
```

Run it in your test script. It fails when sessions resolve anywhere outside the
seam, so the preview bypass stays the single deterministic path and capture-time
patches become unnecessary.