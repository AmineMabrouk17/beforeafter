---
name: beforeafter
description: "Use when turning open PRs and issues into visual flow maps."
version: 0.2.0
author: AmineMabrouk17, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [github, prs, visualization, architecture]
    related_skills: []
---

# BeforeAfter Skill

Turn any repo's open PRs + issues + codebase into 4 visual graphs (HTML), not prose. General-purpose: works from `gh` CLI where the agent already has repo access.

## When to Use

- User asks for pipeline / features / user-flow as graphs, diagrams, or general view
- User asks what open PRs change, in what order to merge, or where conflicts hide
- User wants persona / feature impact at a glance, not a text summary
- Don't use for: single-PR code review, writing code, closed-PR history

## Prerequisites

- `gh` authenticated (`terminal(command="gh auth status")`)
- Repo slug known (`owner/repo`); default to `gh repo view --json nameWithOwner`
- No clone needed: prefer `gh api` web reads unless local files already exist
- Local clone IF visual capture is needed (`git worktree` flow), and `node` for the provided scripts

## Core principle: reuse, don't reinvent

Before collecting anything, **detect what the repo already ships** and drive it:

1. Visual pipeline present? Look for `scripts/visual/capture-before-after.sh`, `scripts/visual/capture-map.mjs`, `scripts/visual/publish-shots.mjs`, `docs/shots/`. If present, the repo has a working per-PR capture + publish workflow — **do not rebuild auth, workspaces, or shot naming**. Drive the existing scripts and merge their outputs into the flow map.
2. Preview bypass present? Look for `lib/auth/preview-bypass.ts` (or equivalent HMAC/synthetic-session seam) and a test helper under `tests/`. Route every capture through it. Never create accounts, never write to the DB.
3. Nothing present? Fall back to the generic kit in `templates/shots/` and the generic overlay in this skill.

The skill's real job is: **rank, order, conflict-DAG, and weave the repo's own screenshots into the map** — not to re-derive capture machinery from scratch.

## Quick Reference

- List PRs (rich): `terminal(command="gh pr list -R OWNER/REPO --state open --limit 30 --json number,title,headRefName,headRefOid,baseRefName,isDraft,updatedAt,additions,deletions,files,reviews,statusCheckRollup")`
- Declared deps (GitHub PR graph): `terminal(command="gh pr view NUM -R OWNER/REPO --json dependsOnId,dependentPRs")`
- List issues: `terminal(command="gh issue list -R OWNER/REPO --state open --limit 50")`
- Issue body: `terminal(command="gh issue view NUM -R OWNER/REPO --json title,body")`
- PR files: `terminal(command="gh pr view NUM -R OWNER/REPO --json title,additions,deletions,files")`
- Merge state: `terminal(command="gh pr view NUM -R OWNER/REPO --json mergeable,mergeStateStatus,isDraft")`
- Tree (no clone, resolve branch first): `terminal(command="gh api repos/OWNER/REPO/git/trees/{branch}?recursive=1 --jq '.tree[] | select(.type==\"blob\") | .path'")`

## Procedure

1. **Detect (30s).** Scan for the repo's visual pipeline + bypass (see Core principle). Record which pieces exist: `capture-before-after.sh`, `capture-map.mjs`, `publish-shots.mjs`, preview bypass, `docs/shots/` naming. Done when you know "use repo scripts" vs "use generic kit".

2. **Collect (read-only, no clone).** List open PRs + open issues with rich JSON (see Quick Reference). Resolve default branch via `gh repo view --json defaultBranchRef`. Done when every open PR has number, title, branch, base, head OID, isDraft, updatedAt, +add/-del, files, mergeable, checks.

3. **Link issues <-> PRs.** Match by GitHub's declared `dependsOnId`/`dependentPRs` first (these are facts), then branch name (`feat/issue-69-*`), body `Closes #N`, or title overlap. Done when each PR maps to 0+ issues and each issue notes Depends/Blocks lines.

4. **Dependency DAG (facts, then heuristics).** Build the graph from: (a) declared `dependsOnId` edges, (b) explicit issue-body Depends/Blocks, (c) stacked branches (base = another open PR's head), (d) shared base files (migrations, lib/*, schema) as a *cross-check*, not a source of truth.
   Topologically sort the DAG; assign each node its **depth layer** (not just 3 buckets — a deep chain A→B→C→D stays a chain). Detect and flag cycles. Bucket only for display: FOUNDATION = depth 0 blockers, PARALLEL = depth 1+ independent siblings, FINAL = sinks that consume the most. When a PR is still a draft, its merged product is implied — note it as "assumed base" only when the graph demands it, and mark it `assumed`.
   Done when merge order is a single linearized list derived from the sort.

5. **Merge-blocking badges.** For each PR compute: `draft`, `failing checks` (from `statusCheckRollup`), `conflicts-with-base` (from `mergeable`), `needs-rebase` (mergeStateStatus !== CLEAN/BLOCKED), `stale ≥2wk` (from `updatedAt`). These land on every PR card and feed the ship-order risk line. Done when each PR carries badges + a one-word status: `ready | review | block | draft`.

6. **Conflict + logic check.** Flag PRs touching the same files (especially `lib/*`, `dashboard/*`, migrations `000N_*`). For the *colliding files only*, fetch `gh pr diff NUM` and pin the exact hunks/functions that collide — never a full-tree diff. Note logic risks as a checklist against the repo's own domain (nullable fields, empty-state/div-by-zero, filter coverage across table+chart, profile/per-persona gates, migration order). Done when every overlap lists colliding paths **and** the specific functions/lines, plus the safer merge order.

7. **Capture per-PR screenshots (fast, only when changed).**
   - If the repo has a capture pipeline: run it. Respect its concurrency (`--parallel`), its secrets, and its naming.
   - Generic fallback: for each open PR head OID, `git worktree add --force --detach .tmp/wt/pr-{num} {headRefOid}`, symlink `node_modules` and the env file, run the spec with a **single shared preview secret**, remove the worktree on success.
   - **Skip unchanged heads:** if `{screen}-after-#{num}.png` already exists for the same `headRefOid`, skip that PR entirely. Re-runs on unchanged PRs must be ~instant.
   - Concurrency: bounded workers (3), one dev-server port each, `wait` between batches. Baseline `-before` shot captures once per screen, reused across all PRs.
   - Cleanup: `trap 'git worktree prune; rm -rf .tmp/wt' EXIT` so failed runs never leave orphan worktrees.
   - Done when each user-facing PR has its own `{screen}-after-#{num}.png` pairs and each screen has one shared `{screen}-before.png`.

8. **Render 4 graphs from data (no hand-written markup).** Populate the JSON blob in `templates/flow.html` (schema in `templates/flows.example.json`) — the page renders itself. Sections: (1) merge pipeline DAG + mergeability badges, (2) user-flow today → after with each PR's own `before/after` screenshots embedded, (3) per-persona / feature matrix, (4) code footprint (DB/server vs UI + diff bars + pinned collision hunks). Reference shots by **raw URL** when preview blocks relative paths, else relative to `docs/shots/`. Done when the HTML's own renderer shows 4 `h2` sections and every PR appears in at least sections 1 and 4 and each user-facing PR in 2 or 3.

9. **Deliver.** Write `<Repo>-Flows.html` to repo root. Also emit `<Repo>-flows.json` (the same data blob) so the map is re-runnable and diffable across releases. Reply with `MEDIA:<abs path>` + `::preview{file="<abs path>"}` + the 3-line merge order + the per-PR status list. If the repo ships `publish-shots.mjs`, offer to post the before/after pairs as comments on each PR (that script keeps them idempotent). Done when preview renders without CDN dependency (inline CSS + inline JS only).

## Auth bypass: make it deterministic, not patched

The single biggest run-to-run cost is the agent thinking about auth. Remove the thinking:

- **One seam (stack-agnostic).** Every data-returning function must resolve its session through the repo's *central* session helper — not an inline auth call sprinkled through pages. (Example: a supabase app centralizes on `getUser()` in `lib/supabase/server.ts`; doesn't inline `supabase.auth.getUser()`. Same idea for firebase/authjs/custom cookies — your stack will name it differently.) Preview bypass + synthetic session live in exactly one module (e.g. `lib/auth/preview-bypass.ts`). One secret per run, exported once, shared by all workers.
- **Guard it with a test, not a patch.** Repos that centralize the seam need **zero** capture-time patching. Add a guard spec/test that fails CI if session resolution appears outside the central module — `templates/auth-bypass-guard.mjs` adapts to any stack via `--pattern` / `--symbol` / `--seam`. If such a guard exists in the repo, prefer it — a patch script that rewrites `lib/*` at capture time is a smell to retire: it breaks the moment stanza shape changes.
- **Rule of thumb:** if capture requires editing repo source, the seam is wrong. Fix the repo once; not the run every time.
- Preview bypass must stay inert in production: only active in a dedicated preview/local/env gate (e.g. `VERCEL_ENV === "preview"`), `*_TEST_SECRET` present, plus a valid HMAC-signed header with a short timestamp window (~5 min) and timing-safe compare. No deterministic behavior change without the header.

## HTML Template Rules

- Single file, inline `<style>` and *inline* `<script>` only — no external JS/CDN (must render offline in preview pane).
- Pages are **data-driven**: edit the JSON blob, never the markup. One `<script type="application/json">` → the renderer builds the sections. This keeps output consistent, scales to 30+ PRs, and makes verification mechanical.
- Dark cards, `.tag` per PR/issue, `.pill` for KPIs, badge colors for merge-blockers, `.src` monospace for file paths.
- Each node: `<b>What</b><span>files + diff size</span>`. Keep text under 20 words per node.
- Always include footer line: source (gh API date), PR/issue numbers, blob count, merge order, and the head-OID of each screenshot ("shots valid at 965fb39") so stale visuals are self-evident.

## Naming conventions (keep these, everywhere)

- Screenshots: `{screen}-before.png` (once per screen) and `{screen}-after-#{prNumber}.png` (per PR). Dashboard shots for PR 82 live at `dashboard-after-#82.png`.
- Capture targets: a `capture-map`-style mapping from PR-branch regex → screens (landing + dashboard defaults, feature branches add e.g. onboarding / navbar-editor). The map tells you *which shots each PR owns* — use it to assemble the before/after section.
- Data blob: `<Repo>-flows.json` alongside `<Repo>-Flows.html`.

## Pitfalls

- `gh api .../git/trees/main` fails on `master` default branch — resolve via `gh repo view --json defaultBranchRef` first.
- Large trees (>1000 blobs) flood context — `head/tail` + count only, never print full tree.
- Branch naming lies — confirm linkage via declared `dependsOnId` + issue body, not branch name alone.
- Migrations must merge in numeric order (`0005` before `0006`) or Supabase apply breaks.
- Preview pane blocks remote images/CDN — never use mermaid.js CDN; use the data-driven HTML/CSS boxes. For shot `<img>` in a PR body/comment use raw `uploads.githubusercontent.com` URLs (via `publish-shots.mjs`); in the local HTML use paths relative to `docs/shots/`.
- Shoot the **PR head OID**, not the branch ref — a stale `after-#N.png` from an old head is worse than no shot. Prune by OID.
- `git worktree remove --force` only works cleanly from the repo root; run cleanup from a `trap` and `git worktree prune` after.
- Don't hand-write the DAG with `translateY` hacks (previous versions did) — the renderer layers nodes by computed depth.

## Verification

- `gh pr list` shows the same open count cited in the HTML footer.
- `<Repo>-Flows.html` opens with all 4 `h2` sections rendered from the JSON blob (no empty sections); `<Repo>-flows.json` matches the same data.
- Each open PR appears in graph 1 and graph 4; each user-facing PR in graph 2 or 3.
- Every user-facing PR's before/after cells show *its own* `{screen}-after-#{num}.png` pairing + the head OID it was shot at — no cross-PR shot mismatches.
- Every PR card carries mergeability badges (`draft/checks/conflicts/stale`); capture skipped no PR whose head OID was uncaptured.
- Conflicting file paths listed explicitly, with pinned hunks for colliding files (not "may conflict").
- If the repo has a preview bypass, the bypass module is the only auth seam for captures and it is guarded by a test (not a patch script).