#!/bin/bash

# Setup script for Secure International Payments Portal
echo "🚀 Setting up Secure International Payments Portal..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 13+ first."
    echo "   You can download it from: https://www.postgresql.org/download/"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "✅ Environment file created. Please edit .env with your configuration."
else
    echo "✅ Environment file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p certs
mkdir -p security-reports
mkdir -p scout-reports

echo "✅ Directories created"

# Generate SSL certificates for development
echo "🔐 Generating SSL certificates for development..."
if command -v openssl &> /dev/null; then
    chmod +x scripts/generate-ssl-certs.sh
    ./scripts/generate-ssl-certs.sh
    echo "✅ SSL certificates generated"
else
    echo "⚠️  OpenSSL not found. SSL certificates not generated."
    echo "   Please install OpenSSL or generate certificates manually."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up PostgreSQL database:"
echo "   createdb secure_payments_portal"
echo "3. Run database migrations:"
echo "   npm run db:migrate"
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- HTTPS: https://localhost:3443"
echo ""
echo "For production deployment, see README.md"
