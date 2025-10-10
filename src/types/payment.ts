export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  provider: 'SWIFT' | 'FEDWIRE' | 'CHIPS';
  recipientName: string;
  recipientAccountNumber: string;
  swiftCode: string;
  recipientBankName: string;
  recipientBankAddress?: string;
  purpose?: string;
  reference?: string;
  fees: number;
  totalAmount: number;
  status: 'PENDING' | 'VERIFIED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  verificationCode: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  processedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
}

export interface PaymentData {
  amount: string;
  currency: string;
  provider?: string;
  recipientName: string;
  recipientAccountNumber: string;
  swiftCode: string;
  recipientBankName: string;
  recipientBankAddress?: string;
  purpose?: string;
  reference?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface PaymentProvider {
  code: string;
  name: string;
  description: string;
}

export interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  fees: {
    upTo1000: number;
    upTo10000: number;
    over10000: number;
  };
  supportedCurrencies: string[];
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    transaction: Transaction;
  };
}

export interface TransactionsResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    transactions: Transaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}
