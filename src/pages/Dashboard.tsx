import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import { 
  CreditCard, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Clock,
  User
} from 'lucide-react';
import { paymentAPI } from '../services/api';
import { Transaction } from '../types/payment';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { securityStatus, isSecureConnection, getSecurityRecommendations } = useSecurity();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load recent transactions
        const transactionsResponse = await paymentAPI.getTransactions(1, 5);
        if (transactionsResponse.success && transactionsResponse.data) {
          setRecentTransactions(transactionsResponse.data.transactions);
          
          // Calculate stats
          const allTransactions = transactionsResponse.data.transactions;
          const totalAmount = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
          const pendingCount = allTransactions.filter(tx => tx.status === 'PENDING').length;
          const completedCount = allTransactions.filter(tx => tx.status === 'COMPLETED').length;
          
          setStats({
            totalTransactions: allTransactions.length,
            pendingTransactions: pendingCount,
            completedTransactions: completedCount,
            totalAmount,
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const securityRecommendations = getSecurityRecommendations();
  const hasHighPriorityIssues = securityRecommendations.some(rec => rec.priority === 'high');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your international payments securely
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <p className="text-sm text-gray-500">Account</p>
              <p className="font-semibold text-gray-900">{user?.accountNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {hasHighPriorityIssues && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Security Attention Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {securityRecommendations
                    .filter(rec => rec.priority === 'high')
                    .slice(0, 3)
                    .map(rec => (
                      <li key={rec.id}>{rec.title}</li>
                    ))}
                </ul>
              </div>
              <div className="mt-3">
                <Link
                  to="/security"
                  className="text-sm font-medium text-red-800 hover:text-red-700"
                >
                  View security settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isSecureConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Insecure Connection
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You are not using a secure HTTPS connection. Please use HTTPS for your security.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/make-payment"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Make New Payment
            </Link>
            <Link
              to="/transactions"
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <History className="w-4 h-4 mr-2" />
              View All Transactions
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection</span>
              <div className="flex items-center">
                {isSecureConnection ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">Secure</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600">Insecure</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Password Age</span>
              <span className="text-sm text-gray-900">{securityStatus.passwordAge} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2FA Status</span>
              <div className="flex items-center">
                {securityStatus.twoFactorEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
                    <span className="text-sm text-yellow-600">Disabled</span>
                  </>
                )}
              </div>
            </div>
            <Link
              to="/security"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Manage security settings →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link
              to="/transactions"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <Link
                to="/make-payment"
                className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-500"
              >
                Make your first payment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.recipientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
