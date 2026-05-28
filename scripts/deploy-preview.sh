#!/bin/sh -e

# Boot or update an ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID, CI_COMMIT_SHA, CI_REPOSITORY_URL
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY
#
# Required env on the remote (deploy.env):
#   PREVIEW_HOST_DIR    — parent dir for per-MR working copies
#   PREVIEW_DOMAIN      — wildcard base, e.g. preview.suro.app
#   PREVIEW_ENV_FILE    — path to shared preview secrets (Resend, Uploadthing, etc.)
#   PREVIEW_DOCKER_NETWORK — Docker network attached to Traefik

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
  DB_CONTAINER="suro-mr-\${IID}-db"
  DB_VOLUME="suro-mr-\${IID}-db"
  HOST="mr-\${IID}.\${PREVIEW_DOMAIN}"
  WORKDIR="\${PREVIEW_HOST_DIR}/mr-\${IID}"

  mkdir -p "\${PREVIEW_HOST_DIR}"
  if [ ! -d "\${WORKDIR}/.git" ]; then
    git clone "\${REPO_URL}" "\${WORKDIR}"
  fi
  cd "\${WORKDIR}"
  git fetch origin "\${SHA}"
  git checkout --force --detach "\${SHA}"

  # Start a per-MR Postgres container if not already running.
  # Data lives in a named volume so it survives app redeployments within the same MR.
  if ! docker inspect "\${DB_CONTAINER}" >/dev/null 2>&1; then
    docker run -d \\
      --name "\${DB_CONTAINER}" \\
      --restart unless-stopped \\
      --network "\${PREVIEW_DOCKER_NETWORK}" \\
      -v "\${DB_VOLUME}:/var/lib/postgresql/data" \\
      -e POSTGRES_DB=suro \\
      -e POSTGRES_PASSWORD=preview \\
      postgres:17-alpine
    until docker exec "\${DB_CONTAINER}" pg_isready -U postgres -q; do sleep 1; done
  fi

  DATABASE_URL="postgresql://postgres:preview@\${DB_CONTAINER}:5432/suro"

  docker build -t "\${IMAGE}" .

  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true

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
