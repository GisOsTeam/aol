# Grant node_modules to user node
sudo chown node node_modules

# Download and install Coexya certificates
SCRIPTS_URL='https://lyovgitlabsig.coexya.lan/devops/terraform/utils/-/raw/master'
INSTALL_CERT_SCRIPT_NAME='03_install_ca_root.sh'
INSTALL_CERT_SCRIPT_FILE=./$INSTALL_CERT_SCRIPT_NAME
## DL script
echo "Download script : $INSTALL_CERT_SCRIPT_NAME"
curl --insecure "$SCRIPTS_URL/$INSTALL_CERT_SCRIPT_NAME" -o $INSTALL_CERT_SCRIPT_FILE
## Run script
echo "Run script : $INSTALL_CERT_SCRIPT_NAME"
sudo bash $INSTALL_CERT_SCRIPT_FILE
## Remove script
rm $INSTALL_CERT_SCRIPT_FILE
## Register certificate to npm
npm config set cafile /etc/ssl/certs/LYOVDEV2PKI01.pem
