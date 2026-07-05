#!/usr/bin/env bash
# Wait for an EAS cloud build (triggered with --no-wait in CI) to finish,
# verify its app version, and download the store artifact. Used by the manual
# submit jobs — the build jobs exit as soon as EAS accepts the build.
#
# Polls the Expo GraphQL API directly (not `eas build:view`) so the submit
# jobs only need EXPO_TOKEN + curl + jq, without eas-cli project/VCS setup.
set -euo pipefail

PLATFORM="${1:?platform (android|ios) required}"
EAS_JSON="${2:?path to eas build json required}"
OUTPUT="${3:?output path required}"
EXPECTED_VERSION="${4:-}"

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "EXPO_TOKEN is not set (required to poll and download EAS builds)" >&2
  exit 1
fi

BUILD_ID="$(jq -r '(if type=="array" then .[0] else . end) | .id' "$EAS_JSON")"
if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
  echo "No build id in $EAS_JSON" >&2
  exit 1
fi

fetch_build() {
  local response
  if ! response="$(
    curl -sf -X POST "https://api.expo.dev/graphql" \
      -H "Authorization: Bearer ${EXPO_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$(
        jq -nc --arg buildId "$BUILD_ID" '{
          query: "query($buildId: ID!) { builds { byId(buildId: $buildId) { id status appVersion artifacts { applicationArchiveUrl buildUrl } error { message } } } }",
          variables: { buildId: $buildId }
        }'
      )"
  )"; then
    echo "EAS GraphQL request failed (check EXPO_TOKEN and network)" >&2
    return 1
  fi

  local err
  err="$(echo "$response" | jq -r '.errors[0].message // empty')"
  if [ -n "$err" ]; then
    echo "EAS GraphQL error: $err" >&2
    return 1
  fi

  local build
  build="$(echo "$response" | jq '.data.builds.byId')"
  if [ "$build" = "null" ]; then
    echo "Build $BUILD_ID not found" >&2
    return 1
  fi

  echo "$build"
}

echo "Waiting for EAS $PLATFORM build $BUILD_ID to finish..."

POLL_INTERVAL=30
MAX_WAIT=7200
elapsed=0
BUILD=""

while true; do
  BUILD="$(fetch_build)"
  STATUS="$(echo "$BUILD" | jq -r '.status')"

  case "$STATUS" in
    FINISHED) break ;;
    ERRORED | CANCELED)
      echo "Build $BUILD_ID ended with status $STATUS" >&2
      echo "$BUILD" | jq '.error' >&2
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
  APP_VERSION="$(echo "$BUILD" | jq -r '.appVersion')"
  if [ "$APP_VERSION" != "$EXPECTED_VERSION" ]; then
    echo "Build appVersion is $APP_VERSION, expected $EXPECTED_VERSION (root package.json)" >&2
    exit 1
  fi
  echo "appVersion $APP_VERSION matches root package.json"
fi

URL="$(echo "$BUILD" | jq -r '.artifacts.applicationArchiveUrl // .artifacts.buildUrl // empty')"
if [ -z "$URL" ] || [ "$URL" = "null" ]; then
  echo "No artifact URL for finished build $BUILD_ID" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"
curl -fL "$URL" -o "$OUTPUT"
ls -lh "$OUTPUT"
