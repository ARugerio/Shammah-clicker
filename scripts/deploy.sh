#!/usr/bin/env bash
# Compila y publica solo dist/ en la rama gh-pages (sin tocar tu rama actual).
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"

cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="SHAMMAH Deploy" -c user.email="deploy@shammah.local" commit -q -m "Deploy $(date +%Y-%m-%d_%H:%M)"
git push -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages:gh-pages
echo "Publicado: https://arugerio.github.io/Shammah-clicker-studio/"
