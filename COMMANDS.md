# Command Reference - Secure International Payments Portal

## 📋 Essential Commands for Running the Application

### Prerequisites Setup
```bash
# Install Node.js (18+) and npm (8+)
# Download from: https://nodejs.org/

# Install MongoDB
# Download from: https://www.mongodb.com/try/download/community
# Or use MongoDB Atlas (cloud)

# Verify installations
node --version
npm --version
mongod --version
```

### Project Setup Commands
```bash
# 1. Clone/Navigate to project directory
cd /path/to/secure-international-payments-portal

# 2. Install all dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env file with your configuration

# 4. Start MongoDB service (Windows)
net start MongoDB
# Or manually start MongoDB service

# 5. Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

### Development Commands
```bash
# Start both frontend and backend concurrently
npm run dev

# Start only the backend server
npm run server

# Start only the frontend (React app)
npm start

# Build production version
npm run build
```

### Individual Service Commands
```bash
# Backend only (Node.js/Express API)
node server/index.js

# Frontend only (React development server)
npm start

# Frontend with specific port
set PORT=3000 && npm start
```

### Database Commands
```bash
# Connect to MongoDB shell
mongosh

# Create database (if needed)
use secure_payments_portal

# Seed database with sample data
npm run db:seed

# View collections
show collections

# View users
db.users.find()

# View transactions
db.transactions.find()
```

### Security & Testing Commands
```bash
# Run security audit
npm run security-audit

# Run security scan
npm run security-scan

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run SonarQube analysis
npm run sonar

# Run MobSF security scan
npm run mobsf

# Run Scout Suite
npm run scout
```

### Docker Commands (Optional)
```bash
# Build Docker image
docker build -t secure-payments-portal .

# Run with Docker Compose
docker-compose up -d

# Stop Docker services
docker-compose down

# View Docker logs
docker-compose logs -f
```

### Production Commands
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm run server

# Run with PM2 (process manager)
npm install -g pm2
pm2 start server/index.js --name "secure-payments-api"
pm2 start npm --name "secure-payments-frontend" -- start
```

### Troubleshooting Commands
```bash
# Check if ports are in use
netstat -an | findstr ":3000"
netstat -an | findstr ":3001"
netstat -an | findstr ":27017"

# Kill processes on specific ports
taskkill /f /im node.exe
net stop MongoDB
net start MongoDB

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"

# View application logs
tail -f logs/app.log
```

### Health Check Commands
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Test API endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","idNumber":"1234567890123","accountNumber":"1234567890","username":"testuser","password":"TestPass123!"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","accountNumber":"123456789012","password":"TestPass123!"}'
```

## 🚀 Quick Start Sequence

### For First-Time Setup:
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp env.example .env

# 3. Start MongoDB
net start MongoDB

# 4. Start the application
npm run dev
```

### For Daily Development:
```bash
# 1. Start MongoDB (if not running)
net start MongoDB

# 2. Start the application
npm run dev
```

### For Testing/Demo:
```bash
# 1. Ensure MongoDB is running
mongosh --eval "db.runCommand('ping')"

# 2. Start the application
npm run dev

# 3. Open browser to http://localhost:3000
```

## 📍 Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **MongoDB**: mongodb://localhost:27017/secure_payments_portal

## 🔧 Environment Configuration

The `.env` file contains all necessary configuration. Key variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `SESSION_SECRET`: Secret for session management
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
