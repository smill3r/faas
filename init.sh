#!/bin/bash

# Define file paths and folder
CERT_DIR="./certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"
ENV_FILE=".env"
DOMAIN_NAME="localhost"

MONGO_PATH="faas"
MONGO_USER="faas"
MONGO_PASSWORD="password"

APISIX_ADMIN_API_HOST="http://apisix:9180"
APISIX_ADMIN_API_PASSWORD="password"
JWT_SECRET="secret"

# Create the cert directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate a self-signed certificate and key
echo "Generating SSL certificate and key..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" -out "$CERT_FILE" \
  -subj "/CN=$DOMAIN_NAME" \
  -extensions v3_req -config <(cat /etc/ssl/openssl.cnf \
    <(echo "[v3_req]") <(echo "subjectAltName=DNS:$DOMAIN_NAME"))

# Check if the certificate was generated successfully
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Error generating certificate and key!"
  exit 1
fi

# Dump certificate and key into .env file
echo "Dumping certificates into .env file..."

{
  echo "SERVER_CERT=\"$(cat $CERT_FILE)\""
  echo "SERVER_KEY=\"$(cat $KEY_FILE)\""
  echo "DOMAIN_NAME=\"$DOMAIN_NAME\""

  echo "MONGO_PATH=\"$MONGO_PATH\""
  echo "MONGO_USER=\"$MONGO_USER\""
  echo "MONGO_PASSWORD=\"$MONGO_PASSWORD\""

  echo "APISIX_ADMIN_API_HOST=\"$APISIX_ADMIN_API_HOST\""
  echo "APISIX_ADMIN_API_PASSWORD=\"$APISIX_ADMIN_API_PASSWORD\""
  echo "JWT_SECRET=\"$JWT_SECRET\""
} > "$ENV_FILE"

echo "Certificates and environment variables saved to .env file."
