#!/usr/bin/env bash
# beforeafter — one-line installer (Hermes + opencode, any OS via bash)
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.sh | bash -s -- --repo-only
set -e
RAW_BASE="https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main"
SKILL="beforeafter"

HERMES_HOME="${HERMES_HOME:-$HOME/AppData/Local/hermes}"
if [ ! -d "$HERMES_HOME" ] && [ -d "$HOME/.hermes" ]; then HERMES_HOME="$HOME/.hermes"; fi
HERMES_SKILL="$HERMES_HOME/skills/$SKILL"
OPENCODE_GLOBAL="$HOME/.config/opencode/skills/$SKILL"
REPO_LOCAL=".opencode/skills/$SKILL"

MODE="all"
if [ "$1" = "--repo-only" ]; then MODE="repo"; fi
if [ "$1" = "--global-only" ]; then MODE="global"; fi

fetch() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  if command -v curl >/dev/null 2>&1; then curl -fsSL "$src" -o "$dst"
  elif command -v wget >/dev/null 2>&1; then wget -qO "$dst" "$src"
  else echo "need curl or wget"; exit 1; fi
}

echo "→ beforeafter installer ($MODE)"

if [ "$MODE" = "all" ] || [ "$MODE" = "global" ]; then
  echo "→ Hermes: $HERMES_SKILL"
  mkdir -p "$HERMES_SKILL/templates"
  fetch "$RAW_BASE/SKILL.md" "$HERMES_SKILL/SKILL.md"
  fetch "$RAW_BASE/templates/flow.html" "$HERMES_SKILL/templates/flow.html"
  echo "  ✓ Hermes installed"

  echo "→ opencode (global): $OPENCODE_GLOBAL"
  mkdir -p "$OPENCODE_GLOBAL/templates"
  fetch "$RAW_BASE/SKILL.md" "$OPENCODE_GLOBAL/SKILL.md"
  fetch "$RAW_BASE/templates/flow.html" "$OPENCODE_GLOBAL/templates/flow.html"
  echo "  ✓ opencode global installed"
fi

if [ "$MODE" = "all" ] || [ "$MODE" = "repo" ]; then
  if [ -d ".git" ]; then
    echo "→ repo-local: $REPO_LOCAL"
    mkdir -p "$REPO_LOCAL"
    fetch "$RAW_BASE/SKILL.md" "$REPO_LOCAL/SKILL.md"
    echo "  ✓ repo-local installed (commit this folder if you want it shared)"
  else
    echo "  ⊘ skip repo-local (no .git here) — run inside a repo or use --global-only"
  fi
fi

echo ""
echo "Done. Verify:"
echo "  Hermes:   skill_view(name='beforeafter')"
echo "  opencode: opencode skill list | grep beforeafter"
