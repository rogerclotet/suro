#!/bin/sh -e

# Production deploy. Runs on the server via SSH; requires the same env on the
# remote that previews use, plus PROD_DOMAIN (e.g. suro.app).

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    set -e
    cd $SSH_PROJECT_DIRECTORY
    . ./deploy.env
    git pull
    docker build -t familia .
    docker stop familia 2>/dev/null || true
    docker rm familia 2>/dev/null || true
    docker run --name=familia --restart=unless-stopped -d \
      -p \$PORT:3000 \
      --network "\$PREVIEW_DOCKER_NETWORK" \
      --label "traefik.enable=true" \
      --label "traefik.docker.network=\$PREVIEW_DOCKER_NETWORK" \
      --label "traefik.http.routers.familia.rule=Host(\\\`\$PROD_DOMAIN\\\`)" \
      --label "traefik.http.routers.familia.entrypoints=websecure" \
      --label "traefik.http.routers.familia.tls.certresolver=letsencrypt" \
      --label "traefik.http.services.familia.loadbalancer.server.port=3000" \
      familia
EOF
)
