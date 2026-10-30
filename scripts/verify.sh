#!/usr/bin/env bash
# Puerta de verificación (constitución, regla 7). Orden: pruebas, build, comprobaciones estáticas sobre dist/, auditoría.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== test =="; npm test --silent
echo "== build =="; npm run build --silent
echo "== static =="; npm run test:static --silent
echo "== audit =="; npm audit --audit-level=high
echo "verify OK"
