const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(req, res, additionalData = {}) {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const responseTime = res.responseTime || 0;
    const userId = req.user ? req.user.id : 'anonymous';
    const sessionId = req.sessionID || 'no-session';

    return {
      timestamp,
      level: this.getLogLevel(statusCode),
      method,
      url,
      statusCode,
      responseTime,
      clientIP,
      userAgent,
      userId,
      sessionId,
      ...additionalData
    };
  }

  getLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'info';
  }

  writeToFile(logEntry) {
    const logFile = path.join(this.logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write audit log:', err);
      }
    });
  }

  logSecurityEvent(eventType, req, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: 200 }, {
      eventType: 'SECURITY',
      securityEvent: eventType,
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.warn(`🚨 Security Event: ${eventType}`, logEntry);
  }

  logAuthenticationEvent(eventType, req, success, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: success ? 200 : 401 }, {
      eventType: 'AUTHENTICATION',
      authEvent: eventType,
      success,
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.log(`🔐 Auth Event: ${eventType}`, logEntry);
  }

  logPaymentEvent(eventType, req, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: 200 }, {
      eventType: 'PAYMENT',
      paymentEvent: eventType,
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.log(`💳 Payment Event: ${eventType}`, logEntry);
  }

  logDataAccess(eventType, req, resource, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: 200 }, {
      eventType: 'DATA_ACCESS',
      dataEvent: eventType,
      resource,
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.log(`📊 Data Access: ${eventType}`, logEntry);
  }

  logError(error, req, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: 500 }, {
      eventType: 'ERROR',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.error(`❌ Error: ${error.message}`, logEntry);
  }

  logSuspiciousActivity(activity, req, additionalData = {}) {
    const logEntry = this.formatLogEntry(req, { statusCode: 200 }, {
      eventType: 'SUSPICIOUS_ACTIVITY',
      activity,
      ...additionalData
    });

    this.writeToFile(logEntry);
    console.warn(`⚠️ Suspicious Activity: ${activity}`, logEntry);
  }
}

const auditLogger = new AuditLogger();

// Middleware function
const auditLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  req.startTime = startTime;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.responseTime = Date.now() - startTime;
    originalEnd.call(this, chunk, encoding);
  };

  // Log the request
  const logEntry = auditLogger.formatLogEntry(req, res);
  auditLogger.writeToFile(logEntry);

  // Log specific events based on route and method
  if (req.path.startsWith('/api/auth')) {
    if (req.method === 'POST' && req.path.includes('login')) {
      // Will be logged in auth controller
    } else if (req.method === 'POST' && req.path.includes('register')) {
      // Will be logged in auth controller
    }
  }

  // Log payment events
  if (req.path.startsWith('/api/payments')) {
    if (req.method === 'POST') {
      auditLogger.logPaymentEvent('PAYMENT_ATTEMPT', req, {
        amount: req.body.amount,
        currency: req.body.currency,
        recipientName: req.body.recipientName
      });
    }
  }

  // Log data access
  if (req.path.startsWith('/api/users') && req.method === 'GET') {
    auditLogger.logDataAccess('USER_DATA_ACCESS', req, 'user_profile');
  }

  // Log file uploads
  if (req.method === 'POST' && req.files) {
    auditLogger.logDataAccess('FILE_UPLOAD', req, 'file', {
      fileCount: req.files.length,
      fileNames: req.files.map(f => f.originalname)
    });
  }

  // Log suspicious patterns
  if (req.body && typeof req.body === 'object') {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i
    ];

    const bodyString = JSON.stringify(req.body);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyString)) {
        auditLogger.logSuspiciousActivity('SUSPICIOUS_INPUT_DETECTED', req, {
          pattern: pattern.toString(),
          input: bodyString.substring(0, 200)
        });
        break;
      }
    }
  }

  next();
};

module.exports = { auditLogger, auditLoggerMiddleware };
