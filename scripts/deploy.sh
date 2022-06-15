(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    source ~/.bashrc
    cd $SSH_PROJECT_DIRECTORY
    git pull
    cd $SSH_PROJECT_DIRECTORY/client
    nvm use 16
    yarn install
    REACT_APP_API_URL=$API_URL yarn build
    cd $SSH_PROJECT_DIRECTORY/server
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
    DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD \
        SECRET_KEY=$SECRET_KEY STATIC_ROOT=$STATIC_ROOT \
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop
    DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD \
        SECRET_KEY=$SECRET_KEY STATIC_ROOT=$STATIC_ROOT \
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    STATIC_ROOT=$STATIC_ROOT docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec api python manage.py collectstatic
EOF
)
