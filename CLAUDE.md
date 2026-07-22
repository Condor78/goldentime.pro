# goldentime.pro

## Lavoro multi-dispositivo (PC casa, PC portatile lavoro, Claude Code on the web)

Questo repo è la fonte di verità condivisa: qualunque dispositivo apra Claude Code su questa cartella (dopo `git clone`/`git pull`) eredita automaticamente le stesse impostazioni, perché `.claude/settings.json` è versionato.

Convenzioni:
- Prima di iniziare a lavorare su un altro dispositivo: `git pull` sul branch corrente.
- Prima di staccare/cambiare dispositivo: commit + push del lavoro, anche parziale, su un branch dedicato.
- Decisioni o contesto non ovvio dal codice: annotarli nel messaggio di commit o in `docs/devlog.md`, non solo a voce nella chat (la chat non è condivisa tra dispositivi).

## docs/devlog.md

Log append-only generato automaticamente a fine sessione da uno hook `SessionEnd` (`.claude/hooks/devlog.sh`): riporta data/ora, macchina, branch, ultimo commit e modifiche non committate. Serve a ricostruire "cosa è successo e dove" quando si riprende da un dispositivo diverso. Non va editato a mano.

## Permessi e sicurezza

`.claude/settings.json` blocca comandi distruttivi (`rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`, `git branch -D`) per tutti i dispositivi, dato che è versionato. Per eccezioni personali, usare `.claude/settings.local.json` (non versionato, va nel `.gitignore`).
