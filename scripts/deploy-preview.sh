#!/bin/sh -e

# Boot or update an ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID, CI_COMMIT_SHA, CI_REPOSITORY_URL
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP
#
# Required env on the remote (typically exported via ~/.bashrc):
#   PREVIEW_HOST_DIR        — parent dir holding per-MR working copies (e.g. ~/suro-previews)
#   PREVIEW_DOMAIN          — wildcard base, e.g. preview.suro.app
#   PREVIEW_PG_ADMIN_URL    — psql URL with CREATEDB privilege
#   PREVIEW_DB_URL_TEMPLATE — connection string with literal "{db}" placeholder
#   PREVIEW_ENV_FILE        — host path to shared preview env file (e.g. /etc/suro/preview.env)
#   PREVIEW_DOCKER_NETWORK  — docker network attached to Traefik (e.g. web)

: "${CI_MERGE_REQUEST_IID:?missing}"
: "${CI_COMMIT_SHA:?missing}"
: "${CI_REPOSITORY_URL:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
  set -e
  . $SSH_PROJECT_DIRECTORY/deploy.env

  IID="$CI_MERGE_REQUEST_IID"
  SHA="$CI_COMMIT_SHA"
  REPO_URL="$CI_REPOSITORY_URL"

  CONTAINER="suro-mr-\${IID}"
  IMAGE="suro:mr-\${IID}"
  DB="suro_mr_\${IID}"
  HOST="mr-\${IID}.\${PREVIEW_DOMAIN}"
  WORKDIR="\${PREVIEW_HOST_DIR}/mr-\${IID}"

  mkdir -p "\${PREVIEW_HOST_DIR}"
  if [ ! -d "\${WORKDIR}/.git" ]; then
    git clone "\${REPO_URL}" "\${WORKDIR}"
  fi
  cd "\${WORKDIR}"
  git fetch origin "\${SHA}"
  git checkout --force --detach "\${SHA}"

  psql "\${PREVIEW_PG_ADMIN_URL}" -tAc "SELECT 1 FROM pg_database WHERE datname='\${DB}'" \\
    | grep -q 1 || createdb -d "\${PREVIEW_PG_ADMIN_URL}" "\${DB}"

  docker build -t "\${IMAGE}" .

  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true

  DATABASE_URL=\$(printf '%s' "\${PREVIEW_DB_URL_TEMPLATE}" | sed "s|{db}|\${DB}|g")

  docker run -d \\
    --name "\${CONTAINER}" \\
    --restart unless-stopped \\
    --network "\${PREVIEW_DOCKER_NETWORK}" \\
    --env-file "\${PREVIEW_ENV_FILE}" \\
    -e DATABASE_URL="\${DATABASE_URL}" \\
    -e AUTH_URL="https://\${HOST}" \\
    --label "traefik.enable=true" \\
    --label "traefik.docker.network=\${PREVIEW_DOCKER_NETWORK}" \\
    --label "traefik.http.routers.\${CONTAINER}.rule=Host(\\\`\${HOST}\\\`)" \\
    --label "traefik.http.routers.\${CONTAINER}.entrypoints=websecure" \\
    --label "traefik.http.routers.\${CONTAINER}.tls.certresolver=letsencrypt" \\
    --label "traefik.http.services.\${CONTAINER}.loadbalancer.server.port=3000" \\
    "\${IMAGE}"

  echo "Preview ready: https://\${HOST}"
EOF
