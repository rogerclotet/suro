#!/bin/sh -e

# Production deploy. Pulls the image built by CI from the registry and restarts
# the production container.
#
# Required env (from GitLab CI):
#   CI_COMMIT_SHA
#   CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE
#   SSH_USERNAME, SSH_PASSWORD, SSH_IP, SSH_PROJECT_DIRECTORY

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
      -p \$PORT:3000 \\
      --network "\$PREVIEW_DOCKER_NETWORK" \\
      --label "traefik.enable=true" \\
      --label "traefik.docker.network=\$PREVIEW_DOCKER_NETWORK" \\
      --label "traefik.http.routers.familia.rule=Host(\\\`\$PROD_DOMAIN\\\`)" \\
      --label "traefik.http.routers.familia.entrypoints=websecure" \\
      --label "traefik.http.routers.familia.tls.certresolver=letsencrypt" \\
      --label "traefik.http.services.familia.loadbalancer.server.port=3000" \\
      "\$IMAGE"
EOF
)
