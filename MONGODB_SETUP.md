# MongoDB Setup Guide

## 🍃 **MongoDB Conversion Complete!**

Your application has been successfully converted from PostgreSQL to MongoDB. Here's what you need to do:

## 📋 **Installation Steps**

### **1. Install MongoDB Community Server**
- Download from: https://www.mongodb.com/try/download/community
- Choose Windows version
- Run the installer with default settings
- MongoDB will run on port **27017** (default)

### **2. Start MongoDB Service**
- MongoDB should start automatically after installation
- Or start manually: `mongod` in command prompt
- Default port: **27017**

### **3. Create Environment File**
Copy `env.example` to `.env` and update:
```env
# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/secure_payments_portal
DB_HOST=localhost
DB_PORT=27017
DB_NAME=secure_payments_portal
```

### **4. Restart Your Application**
```bash
# Stop current server (Ctrl+C)
# Then restart:
node server/index.js
```

## 🔧 **MongoDB Configuration**

- **Port**: 27017 (default)
- **Database**: secure_payments_portal
- **Connection String**: `mongodb://localhost:27017/secure_payments_portal`
- **No username/password required for local development**

## ✅ **Benefits of MongoDB**

1. **Easier Setup**: No complex user management
2. **Flexible Schema**: Easy to modify data structures
3. **JSON Native**: Perfect for JavaScript/Node.js
4. **Built-in Validation**: Mongoose schemas provide validation
5. **Better Performance**: For document-based applications

## 🚀 **Your App is Ready!**

Once MongoDB is running, your application will:
- ✅ Connect to MongoDB automatically
- ✅ Create collections automatically
- ✅ Handle authentication with MongoDB
- ✅ Store transactions in MongoDB
- ✅ Use MongoDB for sessions

## 🎯 **Perfect for Portfolio**

This MongoDB setup is ideal for your Portfolio of Evidence because:
- Modern NoSQL database
- Industry-standard for web applications
- Easy to demonstrate and explain
- Professional development practices
