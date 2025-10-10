import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SecurityContextType {
  securityStatus: SecurityStatus;
  isSecureConnection: boolean;
  lastSecurityCheck: Date | null;
  performSecurityCheck: () => Promise<void>;
  getPasswordStrength: (password: string) => PasswordStrength;
  validateInput: (input: string, type: InputType) => ValidationResult;
  getSecurityRecommendations: () => SecurityRecommendation[];
}

interface SecurityStatus {
  passwordAge: number;
  daysUntilExpiry: number;
  passwordExpired: boolean;
  passwordExpiringSoon: boolean;
  isAccountLocked: boolean;
  failedAttempts: number;
  lastLoginAge: number | null;
  twoFactorEnabled: boolean;
  accountStatus: 'active' | 'inactive';
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: string;
}

interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  completed: boolean;
}

type InputType = 'email' | 'phone' | 'name' | 'accountNumber' | 'idNumber' | 'swiftCode' | 'amount';

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  // For now, we'll work without user context to avoid dependency issues
  const user = null;
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    passwordAge: 0,
    daysUntilExpiry: 90,
    passwordExpired: false,
    passwordExpiringSoon: false,
    isAccountLocked: false,
    failedAttempts: 0,
    lastLoginAge: null,
    twoFactorEnabled: false,
    accountStatus: 'active',
  });
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);

  // Check if connection is secure
  useEffect(() => {
    const checkSecureConnection = () => {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost';
      setIsSecureConnection(isSecure);
    };

    checkSecureConnection();
    window.addEventListener('load', checkSecureConnection);
    
    return () => window.removeEventListener('load', checkSecureConnection);
  }, []);

  // Perform security check
  const performSecurityCheck = async () => {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate the check
      const mockStatus: SecurityStatus = {
        passwordAge: 30,
        daysUntilExpiry: 60,
        passwordExpired: false,
        passwordExpiringSoon: false,
        isAccountLocked: false,
        failedAttempts: 0,
        lastLoginAge: 1,
        twoFactorEnabled: false,
        accountStatus: 'active',
      };

      setSecurityStatus(mockStatus);
      setLastSecurityCheck(new Date());
    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  // Get password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Common pattern checks
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score -= 1;
    }

    if (/123|abc|qwe|asd|zxc/i.test(password)) {
      feedback.push('Avoid sequential patterns');
      score -= 1;
    }

    if (/password|admin|user|test/i.test(password)) {
      feedback.push('Avoid common words');
      score -= 1;
    }

    // Determine strength
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 2) strength = 'weak';
    else if (score < 3) strength = 'fair';
    else if (score < 4) strength = 'good';
    else strength = 'strong';

    return { score: Math.max(0, score), feedback, strength };
  };

  // Validate input based on type
  const validateInput = (input: string, type: InputType): ValidationResult => {
    const errors: string[] = [];
    let sanitizedValue = input.trim();

    // Basic sanitization
    sanitizedValue = sanitizedValue.replace(/[<>]/g, '');

    switch (type) {
      case 'email':
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitizedValue)) {
          errors.push('Invalid email format');
        }
        break;

      case 'phone':
        if (!/^[\+]?[1-9][\d]{0,15}$/.test(sanitizedValue)) {
          errors.push('Invalid phone number format');
        }
        break;

      case 'name':
        if (!/^[A-Za-z\s]{3,50}$/.test(sanitizedValue)) {
          errors.push('Name must be 3-50 characters and contain only letters and spaces');
        }
        break;

      case 'accountNumber':
        if (!/^\d{10,12}$/.test(sanitizedValue)) {
          errors.push('Account number must be 10-12 digits');
        }
        break;

      case 'idNumber':
        if (!/^\d{13}$/.test(sanitizedValue)) {
          errors.push('ID number must be exactly 13 digits');
        }
        break;

      case 'swiftCode':
        if (!/^[A-Z]{6}[A-Z0-9]{2,5}$/.test(sanitizedValue)) {
          errors.push('SWIFT code must be 8-11 characters: 6 letters + 2-5 alphanumeric');
        }
        break;

      case 'amount':
        const amount = parseFloat(sanitizedValue);
        if (isNaN(amount) || amount <= 0) {
          errors.push('Amount must be a positive number');
        } else if (amount < 1 || amount > 100000) {
          errors.push('Amount must be between $1 and $100,000');
        }
        break;

      default:
        errors.push('Unknown input type');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  };

  // Get security recommendations
  const getSecurityRecommendations = (): SecurityRecommendation[] => {
    const recommendations: SecurityRecommendation[] = [];

    // Password recommendations
    if (securityStatus.passwordExpired) {
      recommendations.push({
        id: 'password-expired',
        title: 'Password Expired',
        description: 'Your password has expired and needs to be changed immediately.',
        priority: 'high',
        action: 'Change password now',
        completed: false,
      });
    } else if (securityStatus.passwordExpiringSoon) {
      recommendations.push({
        id: 'password-expiring',
        title: 'Password Expiring Soon',
        description: `Your password will expire in ${securityStatus.daysUntilExpiry} days.`,
        priority: 'medium',
        action: 'Change password soon',
        completed: false,
      });
    }

    // Two-factor authentication
    if (!securityStatus.twoFactorEnabled) {
      recommendations.push({
        id: 'enable-2fa',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your account.',
        priority: 'high',
        action: 'Enable 2FA',
        completed: false,
      });
    }

    // Account lock status
    if (securityStatus.isAccountLocked) {
      recommendations.push({
        id: 'account-locked',
        title: 'Account Temporarily Locked',
        description: 'Your account is locked due to too many failed login attempts.',
        priority: 'high',
        action: 'Contact support',
        completed: false,
      });
    }

    // Failed attempts
    if (securityStatus.failedAttempts > 0) {
      recommendations.push({
        id: 'failed-attempts',
        title: 'Recent Failed Login Attempts',
        description: `${securityStatus.failedAttempts} failed login attempts detected.`,
        priority: 'medium',
        action: 'Review account security',
        completed: false,
      });
    }

    // Connection security
    if (!isSecureConnection) {
      recommendations.push({
        id: 'insecure-connection',
        title: 'Insecure Connection',
        description: 'You are not using a secure HTTPS connection.',
        priority: 'high',
        action: 'Use HTTPS',
        completed: false,
      });
    }

    return recommendations;
  };

  // Perform security check when user changes
  useEffect(() => {
    if (user) {
      performSecurityCheck();
    }
  }, [user]);

  const value: SecurityContextType = {
    securityStatus,
    isSecureConnection,
    lastSecurityCheck,
    performSecurityCheck,
    getPasswordStrength,
    validateInput,
    getSecurityRecommendations,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
