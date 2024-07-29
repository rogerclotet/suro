#!/bin/sh

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    source ~/.bashrc
    cd $SSH_PROJECT_DIRECTORY
    git pull
    docker build -t familia .
    docker stop familia
    docker rm familia
    docker run --name=familia --restart=unless-stopped -d -p $PORT:3000 familia
EOF
)
