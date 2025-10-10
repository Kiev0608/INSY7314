@echo off
REM Generate SSL certificates for development (Windows)
echo 🔐 Generating SSL certificates for development...

REM Create certs directory
if not exist certs mkdir certs

REM Generate private key
openssl genrsa -out certs\private-key.pem 2048

REM Generate certificate signing request
openssl req -new -key certs\private-key.pem -out certs\certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

REM Generate self-signed certificate
openssl x509 -req -in certs\certificate.csr -signkey certs\private-key.pem -out certs\certificate.pem -days 365

REM Clean up CSR file
del certs\certificate.csr

echo ✅ SSL certificates generated successfully!
echo 📁 Certificates are located in the 'certs' directory
echo 🔒 Private key: certs\private-key.pem
echo 📜 Certificate: certs\certificate.pem
echo.
echo ⚠️  WARNING: These are self-signed certificates for development only!
echo    For production, use certificates from a trusted Certificate Authority.
