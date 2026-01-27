#!/bin/sh -e

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    set -e
    source ~/.bashrc
    cd $SSH_PROJECT_DIRECTORY
    git pull
    docker build -t familia .
    docker stop familia 2>/dev/null || true
    docker rm familia 2>/dev/null || true
    docker run --name=familia --restart=unless-stopped -d -p $PORT:3000 familia
EOF
)
