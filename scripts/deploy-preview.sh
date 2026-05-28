#!/bin/sh -e

# Boot or update an ephemeral preview environment for a GitLab merge request.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID
#   CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY
#
# Required env on the remote (deploy.env):
#   PREVIEW_DOMAIN      — wildcard base, e.g. suro.clotet.dev
#   PREVIEW_ENV_FILE    — path to shared preview secrets (Resend, Uploadthing, etc.)
#   PREVIEW_DOCKER_NETWORK — Docker network attached to Traefik
#   TRAEFIK_ROUTES_DIR  — directory watched by Traefik's file provider

: "${CI_MERGE_REQUEST_IID:?missing}"
: "${CI_REGISTRY:?missing}"
: "${CI_REGISTRY_USER:?missing}"
: "${CI_REGISTRY_PASSWORD:?missing}"
: "${CI_REGISTRY_IMAGE:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<EOF
  set -e
  . $SSH_PROJECT_DIRECTORY/deploy.env

  IID="$CI_MERGE_REQUEST_IID"
  IMAGE="$CI_REGISTRY_IMAGE:mr-$CI_MERGE_REQUEST_IID"

  CONTAINER="suro-mr-\${IID}"
  DB_CONTAINER="suro-mr-\${IID}-db"
  DB_VOLUME="suro-mr-\${IID}-db"
  HOST="mr-\${IID}.\${PREVIEW_DOMAIN}"

  # Start a per-MR Postgres container if not already running.
  # Data lives in a named volume so it survives app redeployments within the same MR.
  if ! docker container inspect "\${DB_CONTAINER}" >/dev/null 2>&1; then
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

  docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  docker pull "\${IMAGE}"
  docker logout "$CI_REGISTRY"

  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true

  docker run -d \\
    --name "\${CONTAINER}" \\
    --restart unless-stopped \\
    --network "\${PREVIEW_DOCKER_NETWORK}" \\
    --env-file "\${PREVIEW_ENV_FILE}" \\
    -e DATABASE_URL="\${DATABASE_URL}" \\
    -e AUTH_URL="https://\${HOST}" \\
    "\${IMAGE}"

  # Write Traefik route using placeholders to avoid backtick quoting issues.
  TMPL=\$(mktemp)
  cat > "\${TMPL}" <<'ROUTEEOF'
http:
  routers:
    __CONTAINER__:
      rule: "Host(\`__HOST__\`)"
      entryPoints:
        - websecure
      service: __CONTAINER__
      tls:
        certResolver: letsencrypt
  services:
    __CONTAINER__:
      loadBalancer:
        servers:
          - url: "http://__CONTAINER__:3000"
ROUTEEOF
  sed -e "s|__CONTAINER__|\${CONTAINER}|g" \\
      -e "s|__HOST__|\${HOST}|g" \\
    "\${TMPL}" > "\${TRAEFIK_ROUTES_DIR}/mr-\${IID}.yml"
  rm "\${TMPL}"

  echo "Preview ready: https://\${HOST}"
EOF
