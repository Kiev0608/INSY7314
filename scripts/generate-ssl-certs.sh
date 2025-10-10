#!/bin/bash

# Generate SSL certificates for development
# This script creates self-signed certificates for local development

echo "🔐 Generating SSL certificates for development..."

# Create certs directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/private-key.pem 2048

# Generate certificate signing request
openssl req -new -key certs/private-key.pem -out certs/certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in certs/certificate.csr -signkey certs/private-key.pem -out certs/certificate.pem -days 365

# Clean up CSR file
rm certs/certificate.csr

# Set proper permissions
chmod 600 certs/private-key.pem
chmod 644 certs/certificate.pem

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates are located in the 'certs' directory"
echo "🔒 Private key: certs/private-key.pem"
echo "📜 Certificate: certs/certificate.pem"
echo ""
echo "⚠️  WARNING: These are self-signed certificates for development only!"
echo "   For production, use certificates from a trusted Certificate Authority."
