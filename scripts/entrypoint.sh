#!/bin/sh
set -e

node ./scripts/migrate.mjs
if [ "$SEED_DB" = "true" ]; then
  node ./scripts/seed.mjs
fi
exec node server.js
