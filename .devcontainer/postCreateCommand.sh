# Grant node_modules to user node
sudo chown node node_modules

# Configure npm
npm config set script-shell /bin/bash
npm config set shell /bin/bash