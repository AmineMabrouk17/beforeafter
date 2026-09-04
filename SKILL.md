---
name: beforeafter
description: "Use when turning open PRs and issues into visual flow maps."
version: 0.1.0
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

## Quick Reference

- List PRs: `terminal(command="gh pr list -R OWNER/REPO --state open --limit 30")`
- List issues: `terminal(command="gh issue list -R OWNER/REPO --state open --limit 50")`
- Issue body: `terminal(command="gh issue view NUM -R OWNER/REPO --json title,body")`
- PR files: `terminal(command="gh pr view NUM -R OWNER/REPO --json title,additions,deletions,files")`
- Tree (no clone): `terminal(command="gh api repos/OWNER/REPO/git/trees/main?recursive=1 --jq '.tree[] | select(.type==\"blob\") | .path'")`

## Procedure

1. **Collect (read-only, no clone).** List open PRs + open issues. Done when every open PR has title, branch, files, +add/-del.
2. **Link issues <-> PRs.** Match by branch name (`feat/issue-69-*`), body `Closes #N`, or title overlap. Done when each PR maps to 0+ issues and each issue notes Depends/Blocks lines.
3. **Dependency order.** Build DAG from Depends/Blocks + shared base files (migrations, lib/*, schema). Mark FOUNDATION (blocks others), PARALLEL (independent), FINAL (depends on most). Done when merge order is a single linear suggestion (e.g. fix-anytime -> foundation -> parallel -> final).
4. **Conflict + logic check.** Flag PRs touching the same files (especially same `lib/*`, `dashboard/*`, migrations `000N_*`). Note logic risks: calendar-vs-cycle assumptions, nullable fields, empty-state/div-by-zero, filter coverage (table+chart). Done when every overlap lists the colliding paths and the safer merge order.
5. **Render 4 graphs as one HTML file.** No long prose — labels only. Sections: (1) merge pipeline DAG, (2) user-flow today vs after (before/after), (3) per-persona/feature card matrix, (4) code footprint (DB/server vs UI + diff sizes). If `docs/shots/<screen>-before|after.png` exist, embed them as raw-URL `<img>` in graph 2 nodes (reviewers see visuals logged-out). Done when file exists and opens with all 4 sections.
6. **Deliver.** Write to Desktop or repo root (`<Repo>-Flows.html`), reply with `MEDIA:<abs path>` + `::preview{file="<abs path>"}` + 3-line merge order. Done when preview renders without CDN dependency (inline CSS only).

## HTML Template Rules

- Single file, inline `<style>` only, no external JS/CDN (must render offline in preview pane).
- Dark cards: `.card`, `.node`, `.arrow ▼`, `.tag` per PR/issue, `.pill` for KPIs, `.src` monospace for file paths.
- Each node: `<b>What</b><span>files + diff size</span>`. Keep text under 20 words per node.
- Always include footer line: source (gh API date), PR/issue numbers, blob count, merge order.

## Pitfalls

- `gh api .../git/trees/main` fails on `master` default branch — resolve via `gh repo view --json defaultBranchRef` first.
- Large trees (>1000 blobs) flood context — `head/tail` + count only, never print full tree.
- Branch naming lies — confirm linkage via issue body Depends/Blocks, not branch name alone.
- Migrations must merge in numeric order (`0005` before `0006`) or Supabase apply breaks.
- Preview pane blocks remote images/CDN — never use mermaid.js CDN; use pure HTML/CSS boxes.

## Verification

- `gh pr list` shows same open count cited in HTML footer.
- HTML file exists, <30KB, opens in preview with 4 `h2` sections.
- Each open PR appears in graph 1 and graph 4; each user-facing PR appears in graph 2 or 3.
- Conflicting file paths listed explicitly (not "may conflict").
