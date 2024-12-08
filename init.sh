#!/bin/bash

# Define file paths and folder
CERT_DIR="./certs"
CA_CERT_FILE="$CERT_DIR/ca.crt"
CA_KEY_FILE="$CERT_DIR/ca.key"
CA_CSR_FILE="$CERT_DIR/ca.csr"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"
CSR_FILE="$CERT_DIR/server.csr"
ENV_FILE=".env"
DOMAIN_NAME="localhost"

MONGO_PATH="faas"
MONGO_USER="faas"
MONGO_PASSWORD="password"
MONGO_HOST="mongodb"
MONGO_PORT="27017"

APISIX_ADMIN_API_HOST="http://apisix:9180"
APISIX_ADMIN_API_PASSWORD="password"

NATS_URL="nats://nats:4222"
NATS_USER="myuser"
NATS_PASS="mypassword"

# Create the cert directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate a self-signed certificate and key
echo "Generating SSL certificate and key..."

openssl genrsa -out "$CA_KEY_FILE" 2048 && \
  openssl req -new -sha256 -key "$CA_KEY_FILE" -out "$CA_CSR_FILE" -subj "/CN=ROOTCA" && \
  openssl x509 -req -days 36500 -sha256 -extfile openssl.cnf -extensions v3_ca -signkey "$CA_KEY_FILE" -in "$CA_CSR_FILE" -out "$CA_CERT_FILE"

openssl genrsa -out "$KEY_FILE" 2048 && \
  openssl req -new -sha256 -key "$KEY_FILE" -out "$CSR_FILE" -subj "/CN=$DOMAIN_NAME" && \
  openssl x509 -req -days 36500 -sha256 -extfile openssl.cnf -extensions v3_req \
  -CA "$CA_CERT_FILE" -CAkey "$CA_KEY_FILE" -CAserial "$CERT_DIR/ca.srl" -CAcreateserial \
  -in "$CSR_FILE" -out "$CERT_FILE"

# Check if the certificate was generated successfully
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Error generating certificate and key!"
  exit 1
fi

# Dump certificate and key into .env file
echo "Dumping certificates into .env file..."

{
  echo "DOMAIN_NAME=\"$DOMAIN_NAME\""
  echo ""
  echo "#Mongo"
  echo "MONGO_PATH=\"$MONGO_PATH\""
  echo "MONGO_USER=\"$MONGO_USER\""
  echo "MONGO_PASSWORD=\"$MONGO_PASSWORD\""
  echo "MONGO_HOST=\"$MONGO_HOST\""
  echo "MONGO_PORT=\"$MONGO_PORT\""
  echo ""
  echo "#APISIX"
  echo "APISIX_ADMIN_API_HOST=\"$APISIX_ADMIN_API_HOST\""
  echo "APISIX_ADMIN_API_PASSWORD=\"$APISIX_ADMIN_API_PASSWORD\""
  echo ""
  echo "#NATS"
  echo "NATS_URL=\"$NATS_URL\""
  echo "NATS_USER=\"$NATS_USER\""
  echo "NATS_PASS=\"$NATS_PASS\""
  echo ""
  echo "SERVER_CERT=\""
  cat "$CERT_FILE" | sed 's/^/        /'
  echo "\""
  echo "SERVER_KEY=\""
  cat "$KEY_FILE" | sed 's/^/        /'
  echo "\""

} > "$ENV_FILE"

echo "Certificates and environment variables saved to .env file."
