#!/bin/sh

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    source ~/.bashrc
    cd $SSH_PROJECT_FOLDER
    git pull
    docker build -t familia .
    docker run -p $PORT:3000 familia
EOF
)
