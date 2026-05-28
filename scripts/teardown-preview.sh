#!/bin/sh -e

# Tear down the ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID, SSH_USERNAME, SSH_PASSWORD, SSH_IP
#
# Required env on the remote (see deploy-preview.sh for the full list):
#   PREVIEW_HOST_DIR, PREVIEW_PG_ADMIN_URL

: "${CI_MERGE_REQUEST_IID:?missing}"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
  set -e
  source ~/.bashrc

  IID="$CI_MERGE_REQUEST_IID"
  CONTAINER="suro-mr-\${IID}"
  IMAGE="suro:mr-\${IID}"
  DB="suro_mr_\${IID}"
  WORKDIR="\${PREVIEW_HOST_DIR}/mr-\${IID}"

  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true
  docker rmi "\${IMAGE}" 2>/dev/null || true

  dropdb --if-exists -d "\${PREVIEW_PG_ADMIN_URL}" "\${DB}"

  rm -rf "\${WORKDIR}"

  echo "Preview torn down: mr-\${IID}"
EOF
