#!/usr/bin/env bash
# Auto-appends a session summary to docs/devlog.md. Triggered by the SessionEnd hook
# in .claude/settings.json so every machine (home PC, work laptop, web) that opens
# this repo with Claude Code logs its sessions into the same shared, versioned file.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0

INPUT="$(cat)"
REASON="$(printf '%s' "$INPUT" | jq -r '.reason // "n/a"' 2>/dev/null || echo "n/a")"
BRANCH="$(git branch --show-current 2>/dev/null || echo "n/a")"
LAST_COMMIT="$(git log -1 --format='%h %s' 2>/dev/null || echo "n/a")"
CHANGES="$(git status --porcelain 2>/dev/null || true)"

mkdir -p docs
[ -f docs/devlog.md ] || printf '# Devlog\n\nLog automatico delle sessioni Claude Code, generato dallo hook SessionEnd (.claude/hooks/devlog.sh). Ogni voce riporta macchina, branch, ultimo commit e modifiche non ancora committate a fine sessione.\n' > docs/devlog.md

{
  printf '\n## %s - %s - branch `%s` (fine sessione: %s)\n' "$(date '+%Y-%m-%d %H:%M')" "$(hostname)" "$BRANCH" "$REASON"
  printf -- '- Ultimo commit: %s\n' "$LAST_COMMIT"
  if [ -n "$CHANGES" ]; then
    printf -- '- Modifiche non committate:\n'
    printf '%s\n' "$CHANGES" | sed 's/^/    /'
  fi
} >> docs/devlog.md

exit 0
