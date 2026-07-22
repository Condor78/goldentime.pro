#!/usr/bin/env bash
# Autosave + log on SessionEnd: commits & pushes any uncommitted work so it's never
# stuck on one machine, then appends a summary entry to docs/devlog.md. Triggered by
# the SessionEnd hook in .claude/settings.json so every machine (home PC, work
# laptop, web) that opens this repo with Claude Code does this the same way.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" || exit 0

INPUT="$(cat)"
REASON="$(printf '%s' "$INPUT" | jq -r '.reason // "n/a"' 2>/dev/null || echo "n/a")"
BRANCH="$(git branch --show-current 2>/dev/null || echo "")"

AUTOSAVE_STATUS="nessuna modifica da salvare"
if [ -n "$BRANCH" ]; then
  git add -A >/dev/null 2>&1
  if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "Autosave: fine sessione $(date '+%Y-%m-%d %H:%M') su $(hostname)" >/dev/null 2>&1
    if timeout 20 git pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1 \
       && timeout 20 git push -u origin "$BRANCH" >/dev/null 2>&1; then
      AUTOSAVE_STATUS="commit creato e pushato su origin/$BRANCH"
    else
      AUTOSAVE_STATUS="ATTENZIONE: commit creato ma push/pull falliti (rete assente o conflitti) - da risolvere manualmente al prossimo avvio"
    fi
  fi
fi

LAST_COMMIT="$(git log -1 --format='%h %s' 2>/dev/null || echo "n/a")"
CHANGES="$(git status --porcelain 2>/dev/null || true)"

mkdir -p docs
[ -f docs/devlog.md ] || printf '# Devlog\n\nLog automatico delle sessioni Claude Code, generato dallo hook SessionEnd (.claude/hooks/devlog.sh). Ogni voce riporta macchina, branch, ultimo commit, esito autosave ed eventuali modifiche residue non committate a fine sessione.\n' > docs/devlog.md

{
  printf '\n## %s - %s - branch `%s` (fine sessione: %s)\n' "$(date '+%Y-%m-%d %H:%M')" "$(hostname)" "${BRANCH:-n/a}" "$REASON"
  printf -- '- Autosave: %s\n' "$AUTOSAVE_STATUS"
  printf -- '- Ultimo commit: %s\n' "$LAST_COMMIT"
  if [ -n "$CHANGES" ]; then
    printf -- '- Modifiche ancora non committate:\n'
    printf '%s\n' "$CHANGES" | sed 's/^/    /'
  fi
} >> docs/devlog.md

exit 0
