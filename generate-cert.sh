#!/bin/bash

# Define file paths and folder
CERT_DIR="./certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"
ENV_FILE=".env"
DOMAIN_NAME="localhost"

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

# Preserve existing secrets or generate new ones
EXISTING_KEY=$(grep -s '^API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
API_KEY="${EXISTING_KEY:-$(openssl rand -hex 24)}"

EXISTING_NATS_TOKEN=$(grep -s '^NATS_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
NATS_TOKEN="${EXISTING_NATS_TOKEN:-$(openssl rand -hex 32)}"

# Write certificates and config into .env
echo "Writing environment variables to .env..."

{
  echo "SERVER_CERT=\"$(cat $CERT_FILE)\""
  echo "SERVER_KEY=\"$(cat $KEY_FILE)\""
  echo "DOMAIN_NAME=\"$DOMAIN_NAME\""
  echo "API_KEY=\"$API_KEY\""
  echo "NATS_TOKEN=\"$NATS_TOKEN\""
} > "$ENV_FILE"

echo "Done."
