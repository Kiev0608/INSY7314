const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    match: [/^[A-Za-z\s]{3,50}$/, 'Name can only contain letters and spaces']
  },
  idNumber: {
    type: String,
    required: [true, 'Please provide an ID number'],
    unique: true,
    match: [/^\d{13}$/, 'ID number must be exactly 13 digits']
  },
  accountNumber: {
    type: String,
    required: [true, 'Please provide an account number'],
    unique: true,
    match: [/^\d{10,12}$/, 'Account number must be 10-12 digits']
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]{3,30}$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false // Don't include password in queries by default
  },
  salt: {
    type: String,
    required: false, // Will be generated in pre-save hook
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for account lock status
userSchema.virtual('isAccountLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Indexes are defined in schema fields above with unique: true

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Generate salt
    this.salt = crypto.randomBytes(32).toString('hex');
    
    // Hash password with salt
    const passwordWithSalt = this.passwordHash + this.salt;
    this.passwordHash = await argon2.hash(passwordWithSalt, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY) || 65536,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 2,
      timeCost: parseInt(process.env.ARGON2_TIME) || 3
    });
    
    this.passwordChangedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.validatePassword = async function(password) {
  try {
    const passwordWithSalt = password + this.salt;
    return await argon2.verify(this.passwordHash, passwordWithSalt);
  } catch (error) {
    throw new Error('Password validation failed');
  }
};

userSchema.methods.incrementFailedAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes
  
  if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isAccountLocked) {
    this.lockedUntil = new Date(Date.now() + lockTime);
  }
  
  this.failedLoginAttempts += 1;
  await this.save();
};

userSchema.methods.resetFailedAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  await this.save();
};

userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      username: this.username,
      accountNumber: this.accountNumber 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Static methods
userSchema.statics.findByCredentials = async function(username, accountNumber) {
  const user = await this.findOne({
    username: username,
    accountNumber: accountNumber,
    isActive: true
  }).select('+passwordHash +salt');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isAccountLocked) {
    throw new Error('Account is temporarily locked due to too many failed attempts');
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);