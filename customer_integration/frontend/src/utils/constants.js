// Application constants

export const TRANSACTION_TYPES = {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    TRANSFER: 'transfer',
    PAYMENT: 'payment',
};

export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};

export const ACCOUNT_TYPES = {
    CHECKING: 'checking',
    SAVINGS: 'savings',
    CREDIT: 'credit',
};

export const TRANSACTION_CATEGORIES = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'payment', label: 'Payments' },
];

export const DATE_RANGES = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
];

export const CHART_COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
};
