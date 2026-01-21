#!/bin/bash

# Generate self-signed certificates for development
# In production, use proper certificates from Let's Encrypt or CA

mkdir -p ssl

openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem \
    -days 365 -nodes \
    -subj "/C=ID/ST=State/L=City/O=Organization/CN=localhost"

echo "Self-signed certificates generated in ssl/ directory"
