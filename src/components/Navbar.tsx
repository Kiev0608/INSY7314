import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import { 
  Shield, 
  User, 
  LogOut, 
  Menu, 
  X, 
  CreditCard, 
  History, 
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isSecureConnection, getSecurityRecommendations } = useSecurity();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const securityRecommendations = getSecurityRecommendations();
  const hasHighPriorityIssues = securityRecommendations.some(rec => rec.priority === 'high');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSecurityAlert = () => {
    setShowSecurityAlert(!showSecurityAlert);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!user) {
    return (
      <nav className="banking-header">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">
                Secure Payments Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="banking-header">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">
                Secure Payments Portal
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/make-payment"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/make-payment')
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Make Payment</span>
              </Link>
              <Link
                to="/transactions"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/transactions')
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Transactions</span>
              </Link>
              <Link
                to="/profile"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <Link
                to="/security"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/security')
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Security</span>
              </Link>
            </div>

            {/* Security Status & User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Security Status Indicator */}
              <div className="relative">
                <button
                  onClick={toggleSecurityAlert}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    hasHighPriorityIssues || !isSecureConnection
                      ? 'bg-red-500 bg-opacity-20 text-red-200 hover:bg-red-500 hover:bg-opacity-30'
                      : 'bg-green-500 bg-opacity-20 text-green-200 hover:bg-green-500 hover:bg-opacity-30'
                  }`}
                >
                  {hasHighPriorityIssues || !isSecureConnection ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Security</span>
                </button>

                {/* Security Alert Dropdown */}
                {showSecurityAlert && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Security Status
                      </h3>
                      
                      {/* Connection Status */}
                      <div className={`flex items-center space-x-2 p-2 rounded-md mb-3 ${
                        isSecureConnection ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {isSecureConnection ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isSecureConnection ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {isSecureConnection ? 'Secure HTTPS Connection' : 'Insecure Connection'}
                        </span>
                      </div>

                      {/* Security Recommendations */}
                      {securityRecommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Security Recommendations
                          </h4>
                          <div className="space-y-2">
                            {securityRecommendations.slice(0, 3).map((rec) => (
                              <div
                                key={rec.id}
                                className={`p-2 rounded-md text-xs ${
                                  rec.priority === 'high'
                                    ? 'bg-red-50 text-red-800'
                                    : rec.priority === 'medium'
                                    ? 'bg-yellow-50 text-yellow-800'
                                    : 'bg-blue-50 text-blue-800'
                                }`}
                              >
                                <div className="font-medium">{rec.title}</div>
                                <div className="text-gray-600">{rec.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  Welcome, {user.fullName}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-white hover:text-gray-200 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white bg-opacity-10 rounded-md mt-2">
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/make-payment"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/make-payment')
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Make Payment</span>
                </Link>
                <Link
                  to="/transactions"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/transactions')
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <History className="w-4 h-4" />
                  <span>Transactions</span>
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile')
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/security"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/security')
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Security</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close security alert */}
      {showSecurityAlert && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSecurityAlert(false)}
        />
      )}
    </>
  );
};

export default Navbar;
