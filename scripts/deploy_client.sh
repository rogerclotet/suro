(
  sshpass -p $SSH_PASSWORD ssh $SSH_USERNAME@$SSH_IP -o StrictHostKeyChecking=no <<-EOF
    source ~/.bashrc
    cd $SSH_PROJECT_DIRECTORY
    git pull
    cd $SSH_PROJECT_DIRECTORY/client
    nvm use 16
    yarn install
    REACT_APP_API_URL=$API_URL yarn build
EOF
)
