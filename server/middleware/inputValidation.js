const Joi = require('joi');
const xss = require('xss');
const validator = require('validator');

class InputValidation {
  constructor() {
    this.xssOptions = {
      whiteList: {}, // No HTML tags allowed by default
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
      css: false
    };
    
    // RegEx patterns for strict input validation
    this.patterns = {
      fullName: /^[A-Za-z\s]{3,50}$/,
      idNumber: /^\d{13}$/,
      accountNumber: /^\d{10,12}$/,
      username: /^[a-zA-Z0-9_-]{3,30}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phoneNumber: /^[\+]?[1-9][\d]{0,15}$/,
      swiftCode: /^[A-Z]{6}[A-Z0-9]{2,5}$/,
      bankCode: /^[A-Z0-9]{8,11}$/,
      recipientAccount: /^[A-Za-z0-9]{8,20}$/,
      recipientName: /^[A-Za-z\s]{3,50}$/,
      bankName: /^[A-Za-z\s]{3,100}$/,
      purpose: /^[A-Za-z0-9\s]{0,100}$/,
      reference: /^[A-Za-z0-9]{0,50}$/,
      currency: /^[A-Z]{3}$/,
      amount: /^\d+(\.\d{1,2})?$/,
      ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    };
    
    // Supported currencies
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK'];
    
    // Payment amount limits
    this.amountLimits = {
      min: parseFloat(process.env.MIN_PAYMENT_AMOUNT) || 1.00,
      max: parseFloat(process.env.MAX_PAYMENT_AMOUNT) || 100000.00
    };
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input) {
    if (typeof input === 'string') {
      // Remove null bytes and control characters
      input = input.replace(/[\0-\x1F\x7F]/g, '');
      
      // XSS protection
      input = xss(input, this.xssOptions);
      
      // Additional HTML encoding for extra safety
      input = validator.escape(input);
      
      return input.trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        // Sanitize object keys as well
        const sanitizedKey = this.sanitizeInput(key);
        sanitized[sanitizedKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validate full name with strict RegEx
   */
  validateFullName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Full name is required' };
    }

    const sanitized = this.sanitizeInput(name);
    
    if (!this.patterns.fullName.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Full name must be 3-50 characters long and contain only letters and spaces' 
      };
    }

    // Check for suspicious patterns
    if (/(.)\1{3,}/.test(sanitized)) {
      return { isValid: false, error: 'Full name contains repeated characters' };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate ID number (South African ID format)
   */
  validateIdNumber(idNumber) {
    if (!idNumber || typeof idNumber !== 'string') {
      return { isValid: false, error: 'ID number is required' };
    }

    const sanitized = this.sanitizeInput(idNumber);
    
    if (!this.patterns.idNumber.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'ID number must be exactly 13 digits' 
      };
    }

    // Luhn algorithm validation for ID number
    if (!this.validateLuhn(sanitized)) {
      return { isValid: false, error: 'Invalid ID number checksum' };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate account number
   */
  validateAccountNumber(accountNumber) {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return { isValid: false, error: 'Account number is required' };
    }

    const sanitized = this.sanitizeInput(accountNumber);
    
    if (!this.patterns.accountNumber.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Account number must be 10-12 digits' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate username
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }

    const sanitized = this.sanitizeInput(username);
    
    if (!this.patterns.username.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' 
      };
    }

    // Cannot start or end with special characters
    if (sanitized.startsWith('_') || sanitized.startsWith('-') || 
        sanitized.endsWith('_') || sanitized.endsWith('-')) {
      return { 
        isValid: false, 
        error: 'Username cannot start or end with underscore or hyphen' 
      };
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'user', 'guest', 'test', 'api',
      'www', 'mail', 'ftp', 'support', 'help', 'info', 'contact',
      'about', 'privacy', 'terms', 'login', 'logout', 'register',
      'password', 'reset', 'forgot', 'account', 'profile', 'settings',
      'payment', 'transaction', 'bank', 'swift'
    ];

    if (reservedUsernames.includes(sanitized.toLowerCase())) {
      return { isValid: false, error: 'This username is reserved' };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate password with strong requirements
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }

    if (!this.patterns.password.test(password)) {
      return { 
        isValid: false, 
        error: 'Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
      };
    }

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|abc|qwe|asd|zxc/i, // Sequential patterns
      /password|admin|user|test/i, // Common words
      /qwerty|asdfgh|zxcvbn/i // Keyboard patterns
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        return { isValid: false, error: 'Password contains common patterns or words' };
      }
    }

    return { isValid: true, value: password };
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    const sanitized = this.sanitizeInput(email).toLowerCase();
    
    if (!this.patterns.email.test(sanitized)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (sanitized.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    const sanitized = this.sanitizeInput(phone);
    
    if (!this.patterns.phoneNumber.test(sanitized)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate SWIFT code
   */
  validateSwiftCode(swiftCode) {
    if (!swiftCode || typeof swiftCode !== 'string') {
      return { isValid: false, error: 'SWIFT code is required' };
    }

    const sanitized = this.sanitizeInput(swiftCode).toUpperCase();
    
    if (!this.patterns.swiftCode.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'SWIFT code must be 8-11 characters: 6 letters + 2-5 alphanumeric' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount) {
    if (!amount || typeof amount !== 'string') {
      return { isValid: false, error: 'Amount is required' };
    }

    const sanitized = this.sanitizeInput(amount);
    
    if (!this.patterns.amount.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Amount must be a valid number with up to 2 decimal places' 
      };
    }

    const numAmount = parseFloat(sanitized);
    
    if (numAmount < this.amountLimits.min) {
      return { 
        isValid: false, 
        error: `Minimum amount is ${this.amountLimits.min}` 
      };
    }

    if (numAmount > this.amountLimits.max) {
      return { 
        isValid: false, 
        error: `Maximum amount is ${this.amountLimits.max}` 
      };
    }

    return { isValid: true, value: sanitized, numericValue: numAmount };
  }

  /**
   * Validate currency code
   */
  validateCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
      return { isValid: false, error: 'Currency is required' };
    }

    const sanitized = this.sanitizeInput(currency).toUpperCase();
    
    if (!this.patterns.currency.test(sanitized)) {
      return { isValid: false, error: 'Currency must be a 3-letter code' };
    }

    if (!this.supportedCurrencies.includes(sanitized)) {
      return { 
        isValid: false, 
        error: `Currency not supported. Supported currencies: ${this.supportedCurrencies.join(', ')}` 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate recipient account number
   */
  validateRecipientAccount(accountNumber) {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return { isValid: false, error: 'Recipient account number is required' };
    }

    const sanitized = this.sanitizeInput(accountNumber);
    
    if (!this.patterns.recipientAccount.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Recipient account number must be 8-20 alphanumeric characters' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate recipient name
   */
  validateRecipientName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Recipient name is required' };
    }

    const sanitized = this.sanitizeInput(name);
    
    if (!this.patterns.recipientName.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Recipient name must be 3-50 characters and contain only letters and spaces' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate bank name
   */
  validateBankName(bankName) {
    if (!bankName || typeof bankName !== 'string') {
      return { isValid: false, error: 'Bank name is required' };
    }

    const sanitized = this.sanitizeInput(bankName);
    
    if (!this.patterns.bankName.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Bank name must be 3-100 characters and contain only letters and spaces' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate purpose field
   */
  validatePurpose(purpose) {
    if (!purpose) {
      return { isValid: true, value: '' };
    }

    if (typeof purpose !== 'string') {
      return { isValid: false, error: 'Purpose must be a string' };
    }

    const sanitized = this.sanitizeInput(purpose);
    
    if (!this.patterns.purpose.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Purpose must be 0-100 characters and contain only letters, numbers, and spaces' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Validate reference field
   */
  validateReference(reference) {
    if (!reference) {
      return { isValid: true, value: '' };
    }

    if (typeof reference !== 'string') {
      return { isValid: false, error: 'Reference must be a string' };
    }

    const sanitized = this.sanitizeInput(reference);
    
    if (!this.patterns.reference.test(sanitized)) {
      return { 
        isValid: false, 
        error: 'Reference must be 0-50 characters and contain only letters and numbers' 
      };
    }

    return { isValid: true, value: sanitized };
  }

  /**
   * Luhn algorithm validation
   */
  validateLuhn(number) {
    const digits = number.split('').map(Number);
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Create Joi validation schema for registration
   */
  createRegistrationSchema() {
    return Joi.object({
      fullName: Joi.string()
        .pattern(this.patterns.fullName)
        .min(3)
        .max(50)
        .required()
        .messages({
          'string.pattern.base': 'Full name must be 3-50 characters and contain only letters and spaces',
          'any.required': 'Full name is required'
        }),
      idNumber: Joi.string()
        .pattern(this.patterns.idNumber)
        .length(13)
        .required()
        .messages({
          'string.pattern.base': 'ID number must be exactly 13 digits',
          'any.required': 'ID number is required'
        }),
      accountNumber: Joi.string()
        .pattern(this.patterns.accountNumber)
        .min(10)
        .max(12)
        .required()
        .messages({
          'string.pattern.base': 'Account number must be 10-12 digits',
          'any.required': 'Account number is required'
        }),
      username: Joi.string()
        .pattern(this.patterns.username)
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.pattern.base': 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens',
          'any.required': 'Username is required'
        }),
      password: Joi.string()
        .pattern(this.patterns.password)
        .min(8)
        .max(128)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required'
        }),
      email: Joi.string()
        .email()
        .max(254)
        .optional()
        .messages({
          'string.email': 'Invalid email format'
        }),
      phoneNumber: Joi.string()
        .pattern(this.patterns.phoneNumber)
        .optional()
        .messages({
          'string.pattern.base': 'Invalid phone number format'
        })
    });
  }

  /**
   * Create Joi validation schema for payment
   */
  createPaymentSchema() {
    return Joi.object({
      amount: Joi.string()
        .pattern(this.patterns.amount)
        .required()
        .messages({
          'string.pattern.base': 'Amount must be a valid number with up to 2 decimal places',
          'any.required': 'Amount is required'
        }),
      currency: Joi.string()
        .valid(...this.supportedCurrencies)
        .required()
        .messages({
          'any.only': `Currency must be one of: ${this.supportedCurrencies.join(', ')}`,
          'any.required': 'Currency is required'
        }),
      provider: Joi.string()
        .valid('SWIFT', 'FEDWIRE', 'CHIPS')
        .default('SWIFT')
        .messages({
          'any.only': 'Provider must be SWIFT, FEDWIRE, or CHIPS'
        }),
      recipientName: Joi.string()
        .pattern(this.patterns.recipientName)
        .min(3)
        .max(50)
        .required()
        .messages({
          'string.pattern.base': 'Recipient name must be 3-50 characters and contain only letters and spaces',
          'any.required': 'Recipient name is required'
        }),
      recipientAccountNumber: Joi.string()
        .pattern(this.patterns.recipientAccount)
        .min(8)
        .max(20)
        .required()
        .messages({
          'string.pattern.base': 'Recipient account number must be 8-20 alphanumeric characters',
          'any.required': 'Recipient account number is required'
        }),
      swiftCode: Joi.string()
        .pattern(this.patterns.swiftCode)
        .min(8)
        .max(11)
        .required()
        .messages({
          'string.pattern.base': 'SWIFT code must be 8-11 characters: 6 letters + 2-5 alphanumeric',
          'any.required': 'SWIFT code is required'
        }),
      recipientBankName: Joi.string()
        .pattern(this.patterns.bankName)
        .min(3)
        .max(100)
        .required()
        .messages({
          'string.pattern.base': 'Bank name must be 3-100 characters and contain only letters and spaces',
          'any.required': 'Bank name is required'
        }),
      recipientBankAddress: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Bank address must be less than 500 characters'
        }),
      purpose: Joi.string()
        .pattern(this.patterns.purpose)
        .max(100)
        .optional()
        .allow('')
        .messages({
          'string.pattern.base': 'Purpose must contain only letters, numbers, and spaces'
        }),
      reference: Joi.string()
        .pattern(this.patterns.reference)
        .max(50)
        .optional()
        .allow('')
        .messages({
          'string.pattern.base': 'Reference must contain only letters and numbers'
        })
    });
  }

  /**
   * Middleware for request validation
   */
  validateRequest(schema) {
    return (req, res, next) => {
      // Sanitize all input
      req.body = this.sanitizeInput(req.body);
      req.query = this.sanitizeInput(req.query);
      req.params = this.sanitizeInput(req.params);
      
      // Validate against schema
      const { error, value } = schema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true,
        convert: false
      });
      
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      req.body = value;
      next();
    };
  }
}

module.exports = new InputValidation();
