# Screenshot kit — per-repo adaptation checklist

Only 3 things vary per repo. Everything else (session reuse, paths, PR table) is identical.

1. **Seeded demo user** — add a `seed.demo` script in your repo (SQL / Prisma / fixtures)
   with realistic data. Creds → CI secrets + local env (`E2E_USER`, `E2E_PASS`).
   Never commit creds. Normal RLS/permissions apply to the demo user.
2. **`auth.setup.ts`** — set login URL + form selectors + post-login assertion.
3. **`shots.spec.ts`** — set `SCREENS` (name, path, ready-selector) for screens issues touch.

Flow per visual issue (used by `github-issue-batch` step 4b):

```bash
E2E_BASE_URL=<preview-or-local> E2E_USER=... E2E_PASS=... \
  pnpm exec playwright test --project=setup
E2E_BASE_URL=<same> pnpm exec playwright test shots.spec.ts
git add docs/shots/<screen>-after.png
git commit -m "shots: <screen> after (#N)" && git push
```

PR body must contain:

```md
| Before (main) | After (this PR) |
|---|---|
| ![](https://raw.githubusercontent.com/<owner>/<repo>/main/docs/shots/<screen>-before.png) | ![](https://raw.githubusercontent.com/<owner>/<repo>/<branch>/docs/shots/<screen>-after.png) |
```

Commit `<screen>-before.png` to `main` once per screen. Reviewers need no login.
No-auth pages: skip the demo user, screenshot the preview directly, same paths.
