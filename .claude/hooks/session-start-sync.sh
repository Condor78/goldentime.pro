#!/usr/bin/env bash
# Auto-pulls the current branch at session start so every device begins from the
# latest state pushed by any other device (autosaved by devlog.sh on SessionEnd).
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0

BRANCH="$(git branch --show-current 2>/dev/null || echo "")"
if [ -n "$BRANCH" ]; then
  timeout 20 git fetch origin "$BRANCH" >/dev/null 2>&1
  timeout 20 git pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1
fi

exit 0
