#!/bin/sh -e

# Tear down the ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY

: "${CI_MERGE_REQUEST_IID:?missing}"
: "${CI_REGISTRY_IMAGE:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
  set -e
  . $SSH_PROJECT_DIRECTORY/deploy.env

  IID="$CI_MERGE_REQUEST_IID"
  CONTAINER="suro-mr-\${IID}"
  IMAGE="$CI_REGISTRY_IMAGE:mr-$CI_MERGE_REQUEST_IID"
  DB_CONTAINER="suro-mr-\${IID}-db"
  DB_VOLUME="suro-mr-\${IID}-db"

  rm -f "\${TRAEFIK_ROUTES_DIR}/mr-\${IID}.yml"

  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true
  docker stop "\${DB_CONTAINER}" 2>/dev/null || true
  docker rm "\${DB_CONTAINER}" 2>/dev/null || true
  docker volume rm "\${DB_VOLUME}" 2>/dev/null || true
  docker rmi "\${IMAGE}" 2>/dev/null || true

  echo "Preview torn down: mr-\${IID}"
EOF
