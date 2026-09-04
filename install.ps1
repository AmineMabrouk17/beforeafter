#Requires download — opencode/Hermes skill installer for Windows PowerShell
# Usage:
#   irm https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main/install.ps1 | iex
param([switch]$RepoOnly, [switch]$GlobalOnly)
$ErrorActionPreference="Stop"
$RawBase="https://raw.githubusercontent.com/AmineMabrouk17/beforeafter/main"
$Skill="beforeafter"
$HermesHome = if ($env:HERMES_HOME) { $env:HERMES_HOME } else { "$env:LOCALAPPDATA/hermes" }
if (-not (Test-Path $HermesHome) -and (Test-Path "$env:USERPROFILE/.hermes")) { $HermesHome="$env:USERPROFILE/.hermes" }
$HermesSkill="$HermesHome/skills/$Skill"
$OpenGlobal="$env:USERPROFILE/.config/opencode/skills/$Skill"
$RepoLocal=".opencode/skills/$Skill"
$All = (-not $RepoOnly -and -not $GlobalOnly)

function Fetch($src,$dst){ New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null; Invoke-WebRequest -Uri $src -OutFile $dst }

Write-Host "-> beforeafter installer"
if ($All -or $GlobalOnly) {
  Write-Host "-> Hermes: $HermesSkill"
  Fetch "$RawBase/SKILL.md" "$HermesSkill/SKILL.md"
  Fetch "$RawBase/templates/flow.html" "$HermesSkill/templates/flow.html"
  Fetch "$RawBase/templates/preview-link.mjs" "$HermesSkill/templates/preview-link.mjs"
  Fetch "$RawBase/templates/shots/auth.setup.ts" "$HermesSkill/templates/shots/auth.setup.ts"
  Fetch "$RawBase/templates/shots/shots.spec.ts" "$HermesSkill/templates/shots/shots.spec.ts"
  Fetch "$RawBase/templates/shots/README.md" "$HermesSkill/templates/shots/README.md"
  Write-Host "  OK Hermes"
  Write-Host "-> opencode (global): $OpenGlobal"
  Fetch "$RawBase/SKILL.md" "$OpenGlobal/SKILL.md"
  Fetch "$RawBase/templates/flow.html" "$OpenGlobal/templates/flow.html"
  Fetch "$RawBase/templates/preview-link.mjs" "$OpenGlobal/templates/preview-link.mjs"
  Fetch "$RawBase/templates/shots/auth.setup.ts" "$OpenGlobal/templates/shots/auth.setup.ts"
  Fetch "$RawBase/templates/shots/shots.spec.ts" "$OpenGlobal/templates/shots/shots.spec.ts"
  Fetch "$RawBase/templates/shots/README.md" "$OpenGlobal/templates/shots/README.md"
  Write-Host "  OK opencode global"
}
if ($All -or $RepoOnly) {
  if (Test-Path ".git") {
    Write-Host "-> repo-local: $RepoLocal"
    Fetch "$RawBase/SKILL.md" "$RepoLocal/SKILL.md"
    Write-Host "  OK repo-local"
  } else { Write-Host "  skip repo-local (no .git here)" }
}
Write-Host "`nDone. Verify: skill_view(name='beforeafter')  |  opencode skill list"
