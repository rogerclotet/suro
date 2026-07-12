#!/bin/sh -e

# Production deploy. Pulls the image CI built from the registry and (re)starts the
# prod container via docker compose. Routing now lives in Pangolin (see AGENTS.md);
# this script no longer writes any Traefik config.
#
# Required env (from GitHub Actions / legacy GitLab CI):
#   CI_COMMIT_SHA
#   CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY
#
# On the remote, compose.yaml must sit in $SSH_PROJECT_DIRECTORY. It needs no host
# .env: WEB_IMAGE and IMAGE_TAG are exported below and PROXY_NETWORK defaults to
# familia-previews (override it in an optional .env there if yours differs).

: "${CI_COMMIT_SHA:?missing}"
: "${CI_REGISTRY:?missing}"
: "${CI_REGISTRY_USER:?missing}"
: "${CI_REGISTRY_PASSWORD:?missing}"
: "${CI_REGISTRY_IMAGE:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

# Ship the compose file from this commit so the host always runs the current
# version — the deploy never relies on a repo checkout being present there.
sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no \
  compose.yaml "$SSH_USERNAME@$SSH_IP:$SSH_PROJECT_DIRECTORY/compose.yaml"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
set -e
cd $SSH_PROJECT_DIRECTORY

docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

# Run exactly the image this pipeline built and pushed.
export WEB_IMAGE="$CI_REGISTRY_IMAGE"
export IMAGE_TAG="$CI_COMMIT_SHA"

# One-time migration off the old 'docker run' deploy: a non-compose 'familia'
# container would block compose from claiming the name. Drop it once; from here on
# compose owns and recreates it.
legacy_project="\$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' familia 2>/dev/null || true)"
if docker inspect familia >/dev/null 2>&1 && [ -z "\$legacy_project" ]; then
  docker rm -f familia
fi

docker compose pull
docker compose up -d

docker logout "$CI_REGISTRY"
EOF
