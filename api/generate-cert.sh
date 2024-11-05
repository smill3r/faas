#!/bin/sh

# Certificate file paths
CERT_DIR="./certificates"
KEY_FILE="$CERT_DIR/key.pem"
CERT_FILE="$CERT_DIR/cert.pem"

# Create the certificates directory if it doesn’t exist
mkdir -p $CERT_DIR

# Check if certificate files already exist
if [ ! -f "$KEY_FILE" ] || [ ! -f "$CERT_FILE" ]; then
    echo "Generating self-signed certificate..."
    openssl req -newkey rsa:2048 -nodes -keyout "$KEY_FILE" -x509 -days 365 -out "$CERT_FILE" \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
    echo "Self-signed certificate generated at $CERT_DIR"
else
    echo "Certificate already exists at $CERT_DIR"
fi
