import React, { useState, useEffect } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { userAPI } from '../services/api';
import { PasswordStrength } from '../types/auth';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const SecuritySettings: React.FC = () => {
  const { 
    securityStatus, 
    isSecureConnection, 
    getSecurityRecommendations,
    getPasswordStrength 
  } = useSecurity();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorData, setTwoFactorData] = useState({
    secret: '',
    qrCodeUrl: '',
    token: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], strength: 'weak' });

  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, you would load security status from API
        // For now, we'll use the context data
      } catch (error) {
        console.error('Error loading security data:', error);
        toast.error('Failed to load security information');
      } finally {
        setIsLoading(false);
      }
    };

    loadSecurityData();
  }, []);

  // Check password strength
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = getPasswordStrength(passwordData.newPassword);
      setPasswordStrength(strength);
    }
  }, [passwordData.newPassword, getPasswordStrength]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordStrength.strength === 'weak') {
      newErrors.newPassword = 'Password is too weak. Please use a stronger password.';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await userAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (response.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsSettingUp2FA(true);
    
    try {
      const response = await userAPI.enable2FA();
      
      if (response.success) {
        setTwoFactorData({
          secret: response.data.secret,
          qrCodeUrl: response.data.qrCodeUrl,
          token: '',
        });
        toast.success('2FA setup initiated. Please scan the QR code.');
      } else {
        toast.error('Failed to enable 2FA');
      }
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorData.token) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying2FA(true);
    
    try {
      const response = await userAPI.verify2FA(twoFactorData.token);
      
      if (response.success) {
        toast.success('2FA enabled successfully');
        setTwoFactorData({
          secret: '',
          qrCodeUrl: '',
          token: '',
        });
        // Refresh security status
        window.location.reload();
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error('Failed to verify 2FA code');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    const token = prompt('Enter your 2FA code to disable:');
    if (!token) return;

    try {
      const response = await userAPI.disable2FA(token);
      
      if (response.success) {
        toast.success('2FA disabled successfully');
        // Refresh security status
        window.location.reload();
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error: any) {
      console.error('2FA disable error:', error);
      toast.error('Failed to disable 2FA');
    }
  };

  const securityRecommendations = getSecurityRecommendations();

  if (isLoading) {
    return <LoadingSpinner text="Loading security settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-600">Manage your account security and privacy settings</p>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {!isSecureConnection && (
        <div className="security-alert error">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Insecure Connection</h3>
            <p className="text-sm">You are not using a secure HTTPS connection. Please use HTTPS for your security.</p>
          </div>
        </div>
      )}

      {/* Security Recommendations */}
      {securityRecommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Security Recommendations
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {securityRecommendations.slice(0, 3).map((rec) => (
                    <li key={rec.id}>{rec.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Security */}
        <div className="form-container">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Password Security
          </h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="input-field">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`block w-full px-3 py-2 pr-10 border ${
                    errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div className="input-field">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`block w-full px-3 py-2 pr-10 border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="password-strength">
                    <div className={`password-strength-bar password-strength-${passwordStrength.strength}`}></div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      passwordStrength.strength === 'weak' ? 'text-red-600' :
                      passwordStrength.strength === 'fair' ? 'text-yellow-600' :
                      passwordStrength.strength === 'good' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)} Password
                    </span>
                    <span className="text-gray-500">
                      {passwordStrength.score}/4
                    </span>
                  </div>
                </div>
              )}
              
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div className="input-field">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`block w-full px-3 py-2 pr-10 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-primary w-full"
            >
              {isChangingPassword ? (
                <>
                  <LoadingSpinner size="small" text="" />
                  <span className="ml-2">Changing Password...</span>
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="form-container">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Two-Factor Authentication
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {securityStatus.twoFactorEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {securityStatus.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {securityStatus.twoFactorEnabled 
                      ? 'Your account is protected with two-factor authentication'
                      : 'Add an extra layer of security to your account'
                    }
                  </p>
                </div>
              </div>
              <div>
                {securityStatus.twoFactorEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={handleEnable2FA}
                    disabled={isSettingUp2FA}
                    className="btn btn-secondary"
                  >
                    {isSettingUp2FA ? (
                      <>
                        <LoadingSpinner size="small" text="" />
                        <span className="ml-2">Setting up...</span>
                      </>
                    ) : (
                      'Enable 2FA'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 2FA Setup */}
            {twoFactorData.qrCodeUrl && (
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Scan QR Code
                </h3>
                <p className="text-xs text-blue-700 mb-4">
                  Use your authenticator app to scan this QR code:
                </p>
                <div className="text-center mb-4">
                  <img 
                    src={twoFactorData.qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="mx-auto w-32 h-32"
                  />
                </div>
                <form onSubmit={handleVerify2FA} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={twoFactorData.token}
                    onChange={(e) => setTwoFactorData(prev => ({ ...prev, token: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={isVerifying2FA}
                    className="btn btn-primary w-full"
                  >
                    {isVerifying2FA ? (
                      <>
                        <LoadingSpinner size="small" text="" />
                        <span className="ml-2">Verifying...</span>
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Status */}
      <div className="form-container">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {isSecureConnection ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-900">Connection</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isSecureConnection ? 'Secure HTTPS' : 'Insecure HTTP'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Password Age</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {securityStatus.passwordAge} days
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {securityStatus.twoFactorEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-900">2FA Status</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {securityStatus.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Last Login</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {securityStatus.lastLoginAge ? `${securityStatus.lastLoginAge} days ago` : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
