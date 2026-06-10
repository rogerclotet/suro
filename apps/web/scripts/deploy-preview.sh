#!/bin/sh -e

# Boot or update an ephemeral preview environment for a GitLab merge request.
# Previews share the dev Convex deployment (baked into the image at build time
# via NEXT_PUBLIC_CONVEX_URL_PREVIEW), so there's no per-MR database.
#
# Required env (from GitLab CI):
#   CI_MERGE_REQUEST_IID
#   CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY
#
# Required env on the remote (deploy.env):
#   PREVIEW_WORKDIR     — parent dir for per-MR compose files
#   PREVIEW_DOMAIN      — wildcard base, e.g. suro.clotet.dev
#   PREVIEW_ENV_FILE    — path to shared preview secrets
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
  HOST="mr-\${IID}.\${PREVIEW_DOMAIN}"
  WORKDIR="\${PREVIEW_WORKDIR}/mr-\${IID}"

  mkdir -p "\${WORKDIR}"

  # Write compose file using placeholders to avoid shell quoting issues.
  TMPL=\$(mktemp)
  cat > "\${TMPL}" <<'COMPOSEEOF'
services:
  app:
    image: __IMAGE__
    container_name: __CONTAINER__
    restart: unless-stopped
    networks:
      - traefik
    env_file:
      - __ENV_FILE__

networks:
  traefik:
    external: true
    name: __NETWORK__
COMPOSEEOF

  sed -e "s|__IMAGE__|\${IMAGE}|g" \\
      -e "s|__CONTAINER__|\${CONTAINER}|g" \\
      -e "s|__NETWORK__|\${PREVIEW_DOCKER_NETWORK}|g" \\
      -e "s|__ENV_FILE__|\${PREVIEW_ENV_FILE}|g" \\
    "\${TMPL}" > "\${WORKDIR}/compose.yml"
  rm "\${TMPL}"

  docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  docker compose -f "\${WORKDIR}/compose.yml" pull
  docker logout "$CI_REGISTRY"

  # Stop any container from a previous deploy before handing off to compose.
  docker stop "\${CONTAINER}" 2>/dev/null || true
  docker rm "\${CONTAINER}" 2>/dev/null || true

  docker compose -f "\${WORKDIR}/compose.yml" up -d --remove-orphans

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
