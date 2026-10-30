#!/usr/bin/env bash
# Puerta de verificación (constitución, regla 7). Se amplía en T004.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== test =="; npm test --silent
echo "== build =="; npm run build --silent
echo "== audit =="; npm audit --audit-level=high
echo "verify OK"
