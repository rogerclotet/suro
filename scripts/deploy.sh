#!/bin/sh -e

# Production deploy. Pulls the image built by CI from the registry and restarts
# the production container.
#
# Required env (from GitLab CI):
#   CI_COMMIT_SHA
#   CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY
#
# Required env on the remote (deploy.env):
#   PROD_DOMAIN            — production hostname for the Traefik route
#   PREVIEW_DOCKER_NETWORK — Docker network shared with Traefik/gerbil
#   TRAEFIK_ROUTES_DIR     — directory watched by Traefik's file provider

: "${CI_COMMIT_SHA:?missing}"
: "${CI_REGISTRY:?missing}"
: "${CI_REGISTRY_USER:?missing}"
: "${CI_REGISTRY_PASSWORD:?missing}"
: "${CI_REGISTRY_IMAGE:?missing}"
: "${SSH_USERNAME:?missing}"
: "${SSH_PASSWORD:?missing}"
: "${SSH_IP:?missing}"
: "${SSH_PROJECT_DIRECTORY:?missing}"

(
  sshpass -p "$SSH_PASSWORD" ssh "$SSH_USERNAME@$SSH_IP" -o StrictHostKeyChecking=no <<-EOF
    set -e
    cd $SSH_PROJECT_DIRECTORY
    . ./deploy.env

    IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

    docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    docker pull "\$IMAGE"
    docker logout "$CI_REGISTRY"

    docker stop familia 2>/dev/null || true
    docker rm familia 2>/dev/null || true

    docker run --name=familia --restart=unless-stopped -d \\
      --env-file .env \\
      --network "\$PREVIEW_DOCKER_NETWORK" \\
      "\$IMAGE"

    # Routing uses Traefik's file provider (no Docker provider, so labels are
    # ignored): write the production route pointing at the container by name
    # over the shared network, mirroring scripts/deploy-preview.sh.
    TMPL=\$(mktemp)
    cat > "\$TMPL" <<'ROUTEEOF'
http:
  routers:
    familia:
      rule: "Host(\`__HOST__\`)"
      entryPoints:
        - websecure
      service: familia
      tls:
        certResolver: letsencrypt
  services:
    familia:
      loadBalancer:
        servers:
          - url: "http://familia:3000"
ROUTEEOF
    sed -e "s|__HOST__|\$PROD_DOMAIN|g" "\$TMPL" > "\$TRAEFIK_ROUTES_DIR/familia.yml"
    rm "\$TMPL"
EOF
)
