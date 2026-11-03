#!/bin/sh
# Startet den Projektraum. Fehlendes wird beim ersten Start automatisch eingerichtet.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ist nicht installiert. Bitte Node.js 20 oder neuer installieren (https://nodejs.org)."
  exit 1
fi
exec node scripts/start.mjs
