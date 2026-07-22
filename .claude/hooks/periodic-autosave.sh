#!/usr/bin/env bash
# Throttled autosave on every Stop event (fires after each Claude response).
# Hooks have no true wall-clock timer, so this piggybacks on Stop and only
# does real work if at least INTERVAL_SECONDS passed since the last autosave -
# giving periodic saves during an active session without spamming a commit
# after every single turn. Runs async (see settings.json) so it never adds
# latency to the conversation. Silent by design: full detail goes to
# docs/devlog.md at SessionEnd (devlog.sh); this just prevents data loss.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0

INTERVAL_SECONDS=600
STATE_FILE=".claude/.last-autosave"

NOW=$(date +%s)
LAST=0
[ -f "$STATE_FILE" ] && LAST=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
[ "$LAST" -eq "$LAST" ] 2>/dev/null || LAST=0

if [ $(( NOW - LAST )) -lt "$INTERVAL_SECONDS" ]; then
  exit 0
fi

mkdir -p .claude
echo "$NOW" > "$STATE_FILE"

BRANCH="$(git branch --show-current 2>/dev/null || echo "")"
[ -z "$BRANCH" ] && exit 0

git add -A >/dev/null 2>&1
if ! git diff --cached --quiet 2>/dev/null; then
  git commit -m "Autosave periodico: $(date '+%Y-%m-%d %H:%M') su $(hostname)" >/dev/null 2>&1
  timeout 20 git pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1
  timeout 20 git push -u origin "$BRANCH" >/dev/null 2>&1
fi

exit 0
