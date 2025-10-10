const express = require('express');
const User = require('../models/User');
const { auditLogger } = require('../middleware/auditLogger');
const { inputValidation } = require('../middleware/inputValidation');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'salt', 'twoFactorSecret'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Log data access
    auditLogger.logDataAccess('PROFILE_ACCESSED', req, 'user_profile', {
      userId: user.id
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          accountNumber: user.accountNumber,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          passwordChangedAt: user.passwordChangedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  auth,
  asyncHandler(async (req, res) => {
    const { fullName, email, phoneNumber } = req.body;
    const user = req.user;

    // Update allowed fields
    if (fullName !== undefined) {
      user.fullName = fullName;
    }
    if (email !== undefined) {
      user.email = email || null;
    }
    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber || null;
    }

    await user.save();

    // Log profile update
    auditLogger.logDataAccess('PROFILE_UPDATED', req, 'user_profile', {
      userId: user.id,
      updatedFields: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          accountNumber: user.accountNumber,
          email: user.email,
          phoneNumber: user.phoneNumber,
          updatedAt: user.updatedAt
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/security-status
 * @desc    Get user security status
 * @access  Private
 */
router.get('/security-status',
  auth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    // Check password age
    const passwordAge = user.passwordChangedAt ? 
      Math.floor((Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const passwordExpiryDays = 90; // 90 days
    const daysUntilExpiry = Math.max(0, passwordExpiryDays - passwordAge);

    // Check failed login attempts
    const isAccountLocked = user.isAccountLocked();
    const failedAttempts = user.failedLoginAttempts;

    // Check last login
    const lastLoginAge = user.lastLoginAt ? 
      Math.floor((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const securityStatus = {
      passwordAge,
      daysUntilExpiry,
      passwordExpired: passwordAge > passwordExpiryDays,
      passwordExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      isAccountLocked,
      failedAttempts,
      lastLoginAge,
      twoFactorEnabled: user.twoFactorEnabled,
      accountStatus: user.isActive ? 'active' : 'inactive'
    };

    // Log security status access
    auditLogger.logDataAccess('SECURITY_STATUS_ACCESSED', req, 'security_status', {
      userId: user.id
    });

    res.json({
      success: true,
      data: { securityStatus }
    });
  })
);

/**
 * @route   POST /api/users/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/enable-2fa',
  auth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication is already enabled'
      });
    }

    // Generate secret
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({
      name: `Secure Payments Portal (${user.username})`,
      issuer: process.env.TOTP_ISSUER || 'Secure Payments Portal',
      length: 32
    });

    // Store secret temporarily (in production, store in database)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Log 2FA setup
    auditLogger.logSecurityEvent('2FA_SETUP_INITIATED', req, {
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Two-factor authentication setup initiated',
      data: {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      }
    });
  })
);

/**
 * @route   POST /api/users/verify-2fa
 * @desc    Verify two-factor authentication setup
 * @access  Private
 */
router.post('/verify-2fa',
  auth,
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = req.user;

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication not set up'
      });
    }

    // Verify token
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before and after
    });

    if (!verified) {
      auditLogger.logSecurityEvent('2FA_VERIFICATION_FAILED', req, {
        userId: user.id
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    // Log 2FA enabled
    auditLogger.logSecurityEvent('2FA_ENABLED', req, {
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });
  })
);

/**
 * @route   POST /api/users/disable-2fa
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post('/disable-2fa',
  auth,
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = req.user;

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication is not enabled'
      });
    }

    // Verify token
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      auditLogger.logSecurityEvent('2FA_DISABLE_FAILED', req, {
        userId: user.id
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    // Log 2FA disabled
    auditLogger.logSecurityEvent('2FA_DISABLED', req, {
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  })
);

/**
 * @route   GET /api/users/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity',
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    // In a real implementation, you would have an activity log table
    // For now, we'll return a mock response
    const activities = [
      {
        id: 1,
        type: 'LOGIN',
        description: 'User logged in successfully',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      {
        id: 2,
        type: 'PROFILE_UPDATE',
        description: 'Profile information updated',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    ];

    // Log activity access
    auditLogger.logDataAccess('ACTIVITY_ACCESSED', req, 'user_activity', {
      userId,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: activities.length,
          itemsPerPage: limit
        }
      }
    });
  })
);

module.exports = router;
