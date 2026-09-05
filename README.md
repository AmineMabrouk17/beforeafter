<h1 align="center">beforeafter</h1>

<p align="center">
  <b>Open PRs in, visual pipeline out — before vs after, not walls of text.</b><br/>
  Free • Any repo • Works with <code>opencode</code>, <code>Hermes</code>, <code>claude-code</code>
</p>

<p align="center">
  <a href="SKILL.md"><img alt="skill" src="https://img.shields.io/badge/skill-ready-6D28FF" /></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-00D1FF" /></a>
</p>

---

## The problem

Open PRs pile up and nobody sees the whole picture:

- Text summaries hide ordering — foundations land after the features built on them
- Same files touched by 3 PRs — conflicts discovered at merge time, not before
- Generic dashboards vs persona needs — every PR looks isolated, impact unclear
- Re-explaining the pipeline for every review, onboarding, or demo

## The fix

One reusable skill:

**`PRs + issues → dependency DAG → conflict check → before/after HTML graphs`**

- **Visual first** — one offline HTML file with 4 graphs, no prose walls
- **Merge order** — a real topological sort layered by depth (deep chains stay chains)
- **Before/after** — today flow vs after-pipeline flow, with **each PR's own screenshots** woven into its card
- **Merge-blocking badges** — draft / failing checks / conflicts / stale, so "ship this first" is actionable
- **Repo-adaptive** — detects the repo's existing visual pipeline + preview bypass and drives it
  (fast worktrees, parallel captures, OID-based skips) instead of re-inventing capture machinery
- **Deterministic auth** — one session seam guarded by a test, so preview capture never patches source

Any repo, any stack: the skill derives everything from `gh` + the repo's own scripts. No BudgetIQ/supabase/finance assumptions in the skill itself — examples are placeholders.

## Quick start

```bash
# Any repo with open PRs
Use beforeafter on owner/repo — map open PRs as flow graphs
```

You get `<Repo>-Flows.html` (+ a machine-readable `<Repo>-flows.json`):

1. **Merge pipeline** — depth-layered DAG with draft/CI/conflict badges
2. **User flow today → after** — per-PR before/after screenshots
3. **Per-persona / feature matrix** — who gets what
4. **Code footprint** — DB/server vs UI + colliding paths pinned to hunks

Say *"preview"* → opens in chat preview pane (no CDN, works offline).

## Install — 1 line (Linux · macOS · Windows)

```bash
# Linux / macOS / Windows (Git Bash) — installs Hermes + opencode (global) + repo-local if inside a git repo
curl -fsSL https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.ps1 | iex
```

Options:

```bash
curl -fsSL https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.sh | bash -s -- --repo-only   # only .opencode/skills in current repo
curl -fsSL https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.sh | bash -s -- --global-only # only Hermes + global opencode
```

Full workflow: **[SKILL.md](SKILL.md)**.

## Repo layout

```
SKILL.md                     # the skill (detect → collect → DAG → conflict-check → capture → render)
templates/flow.html          # data-driven offline template (4 graphs, JSON blob → self-rendering)
templates/flows.example.json # the data schema the agent fills in (neutral example)
templates/auth-bypass-guard.mjs  # one-seam guard test (no more capture-time patches)
templates/preview-link.mjs   # magic login-link minter (demo-link fallback)
templates/shots/             # per-PR screenshot kit (auth.setup + shots.spec + README)
install.sh                   # bash one-line installer
install.ps1                  # PowerShell one-line installer
```

## License

MIT