#!/usr/bin/env bash
# Wait for an EAS cloud build (triggered with --no-wait in CI) to finish,
# verify its app version, and download the store artifact. Used by the manual
# submit jobs — the build jobs exit as soon as EAS accepts the build.
set -euo pipefail

PLATFORM="${1:?platform (android|ios) required}"
EAS_JSON="${2:?path to eas build json required}"
OUTPUT="${3:?output path required}"
EXPECTED_VERSION="${4:-}"

BUILD_ID="$(jq -r '(if type=="array" then .[0] else . end) | .id' "$EAS_JSON")"
if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
  echo "No build id in $EAS_JSON" >&2
  exit 1
fi

echo "Waiting for EAS $PLATFORM build $BUILD_ID to finish..."

POLL_INTERVAL=30
MAX_WAIT=7200
elapsed=0
BUILD_JSON=""

while true; do
  BUILD_JSON="$(pnpm exec eas build:view "$BUILD_ID" --json --non-interactive)"
  STATUS="$(echo "$BUILD_JSON" | jq -r '.status')"

  case "$STATUS" in
    FINISHED) break ;;
    ERRORED | CANCELED)
      echo "Build $BUILD_ID ended with status $STATUS" >&2
      echo "$BUILD_JSON" | jq '.error' >&2
      exit 1
      ;;
    *)
      echo "Build status: $STATUS (${elapsed}s elapsed)"
      ;;
  esac

  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "Timed out after ${MAX_WAIT}s waiting for build $BUILD_ID" >&2
    exit 1
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
done

if [ -n "$EXPECTED_VERSION" ]; then
  APP_VERSION="$(echo "$BUILD_JSON" | jq -r '.appVersion')"
  if [ "$APP_VERSION" != "$EXPECTED_VERSION" ]; then
    echo "Build appVersion is $APP_VERSION, expected $EXPECTED_VERSION (root package.json)" >&2
    exit 1
  fi
  echo "appVersion $APP_VERSION matches root package.json"
fi

URL="$(echo "$BUILD_JSON" | jq -r '.artifacts.applicationArchiveUrl // .artifacts.buildUrl')"
if [ -z "$URL" ] || [ "$URL" = "null" ]; then
  echo "No artifact URL for finished build $BUILD_ID" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"
curl -fL "$URL" -o "$OUTPUT"
ls -lh "$OUTPUT"
