ARG CONTAINER_USER=node
ARG NODE_VERSION=0-18
ARG VARIANT=bullseye
FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}-${VARIANT}

# Montage du cache des extensions vscode
RUN mkdir -p /home/node/.vscode-server/extensions \
    && mkdir -p /home/node/.vscode-server/bin \
    && mkdir -p /home/node/.vscode-server/data \
    && chown -R node /home/node/.vscode-server

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG NVM_NODE_VERSION=v18
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${NVM_NODE_VERSION}"