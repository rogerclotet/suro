#!/bin/sh

(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    cd $SSH_PROJECT_DIRECTORY
    git pull
    cd $SSH_PROJECT_DIRECTORY/client
    yarn install
    REACT_APP_API_URL=$API_URL yarn build
    cd $SSH_PROJECT_DIRECTORY/server
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop
    DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD \
      docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
EOF
)
