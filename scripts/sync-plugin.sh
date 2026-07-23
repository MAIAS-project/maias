#!/usr/bin/env bash
# Sync the Claude Code plugin to its distribution mirror (D23's thin repo).
#
# Source of truth is this monorepo's plugin/ directory. This script:
#   1. refreshes the derived files inside plugin/ (bundled llms.txt per skill,
#      LICENSE/NOTICE from the repo root) — commit those here first;
#   2. mirrors plugin/ verbatim onto MAIAS-project/maias-plugin and pushes.
#
# Run after any change to plugin/ or docs/spec/llms.txt (the no-drift rule
# extends to the mirror: spec changes ride the same day's sync).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIRROR="git@github.com:MAIAS-project/maias-plugin.git"

# 1. Refresh derived content in plugin/
for s in maias-create maias-edit maias-review; do
  mkdir -p "$ROOT/plugin/skills/$s/reference"
  cp "$ROOT/docs/spec/llms.txt" "$ROOT/plugin/skills/$s/reference/llms.txt"
done
cp "$ROOT/LICENSE" "$ROOT/NOTICE" "$ROOT/plugin/"

if ! git -C "$ROOT" diff --quiet -- plugin/; then
  echo "plugin/ has uncommitted changes after refresh — commit them in the monorepo first." >&2
  git -C "$ROOT" status --short -- plugin/ >&2
  exit 1
fi

# 2. Mirror to the thin repo
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone --depth 1 "$MIRROR" "$TMP/maias-plugin"
rsync -a --delete --exclude .git "$ROOT/plugin/" "$TMP/maias-plugin/"

if git -C "$TMP/maias-plugin" status --porcelain | grep -q .; then
  git -C "$TMP/maias-plugin" add -A
  git -C "$TMP/maias-plugin" commit -m "sync from monorepo $(git -C "$ROOT" rev-parse --short HEAD)"
  git -C "$TMP/maias-plugin" push
  echo "mirror updated."
else
  echo "mirror already in sync."
fi
