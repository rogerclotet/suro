#!/bin/sh -e

# Tear down the ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY

: "${CI_MERGE_REQUEST_IID:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
  set -e
  . $SSH_PROJECT_DIRECTORY/deploy.env

  IID="$CI_MERGE_REQUEST_IID"
  WORKDIR="\${PREVIEW_WORKDIR}/mr-\${IID}"

  if [ -f "\${WORKDIR}/compose.yml" ]; then
    docker compose -f "\${WORKDIR}/compose.yml" down -v --remove-orphans
  fi

  rm -rf "\${WORKDIR}"
  rm -f "\${TRAEFIK_ROUTES_DIR}/mr-\${IID}.yml"

  echo "Preview torn down: mr-\${IID}"
EOF
