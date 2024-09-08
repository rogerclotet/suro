#!/bin/sh

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    source ~/.bashrc
    docker pull $IMAGE_TAG
    docker stop familia
    docker run --name=familia --restart=unless-stopped -d -p $PORT:3000 $IMAGE_TAG
    docker image rm -f $(docker images -a | grep -v "$IMAGE_TAG" | awk 'NR>1 {print $3}')
EOF
)
