export interface User {
  id: string;
  fullName: string;
  username: string;
  accountNumber: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  accountNumber: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  idNumber: string;
  accountNumber: string;
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface SecurityStatus {
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

export interface PasswordStrength {
  score: number;
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}
