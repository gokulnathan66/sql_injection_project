import { useState } from 'react';
import './design-system.css';
import './App.css';
import { useToast } from './components/Toast';
import Card from './components/Card';
import Button from './components/Button';
import Badge from './components/Badge';
import Avatar from './components/Avatar';
import Loader from './components/Loader';
import MiniChart from './components/MiniChart';
import { formatCurrency, formatAccountNumber } from './utils/formatters';
import { formatSmartDate } from './utils/dateFormatters';

// Determine API URL: use env var if set, otherwise derive from current hostname with port 5000
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL from env:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Use same hostname/protocol as frontend, but port 5000
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    console.log('Auto-detected API URL:', apiUrl, '(from hostname:', window.location.hostname, ')');
    return apiUrl;
  }
  const defaultUrl = 'http://localhost:5000';
  console.log('Using default API URL:', defaultUrl);
  return defaultUrl;
};
const API_URL = getApiUrl();
console.log('Final API_URL:', API_URL);

function App() {
  const [activeView, setActiveView] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [searchAccount, setSearchAccount] = useState('');
  const [userId, setUserId] = useState('');
  const [accountResults, setAccountResults] = useState(null);
  const [transactionResults, setTransactionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all');

  const { success, error, info, ToastContainer } = useToast();

  // Mock data for enhanced dashboard
  const mockBalanceData = [15000, 15200, 14800, 15500, 15300, 15800, 16000];
  const mockAccounts = [
    { id: 1, type: 'Checking', number: '****4521', balance: 15000.50, change: +2.5 },
    { id: 2, type: 'Savings', number: '****7892', balance: 25000.00, change: +1.2 },
    { id: 3, type: 'Credit Card', number: '****3456', balance: -1250.00, change: -5.3 },
  ];

  const mockRecentTransactions = [
    { id: 1, description: 'Grocery Store', amount: -125.50, date: new Date(), type: 'payment', status: 'completed' },
    { id: 2, description: 'Salary Deposit', amount: 5000.00, date: new Date(Date.now() - 86400000), type: 'deposit', status: 'completed' },
    { id: 3, description: 'Electric Bill', amount: -85.00, date: new Date(Date.now() - 172800000), type: 'payment', status: 'completed' },
    { id: 4, description: 'Transfer to Savings', amount: -500.00, date: new Date(Date.now() - 259200000), type: 'transfer', status: 'completed' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await response.json();

      if (response.ok) {
        setLoggedInUser(data.user);
        setActiveView('dashboard');
        success('Login successful! Welcome back.');
      } else {
        error(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/accounts?account_number=${searchAccount}`);
      const data = await response.json();

      if (response.ok) {
        setAccountResults(data);
        success('Account search completed');
      } else {
        error(data.error || 'Search failed');
        setAccountResults(null);
      }
    } catch (err) {
      error('Failed to search accounts');
      setAccountResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactions = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/transactions?user_id=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setTransactionResults(data);
        success('Transactions loaded successfully');
      } else {
        error(data.error || 'Failed to fetch transactions');
        setTransactionResults(null);
      }
    } catch (err) {
      error('Failed to load transactions');
      setTransactionResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveView('login');
    setLoginData({ username: '', password: '' });
    setAccountResults(null);
    setTransactionResults(null);
    info('Logged out successfully');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5H7z" />
          </svg>
        );
      case 'payment':
      case 'withdrawal':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Login View
  if (activeView === 'login') {
    return (
      <div className="app">
        <ToastContainer />
        <div className="login-container">
          <div className="login-card animate-fadeIn">
            <div className="login-header">
              <div className="bank-logo">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v2h20V7l-10-5zm-8 7v10h2V9H4zm4 0v10h2V9H8zm4 0v10h2V9h-2zm4 0v10h2V9h-2zm4 0v10h2V9h-2zM2 21h20v2H2v-2z" />
                </svg>
              </div>
              <h1>SecureBank</h1>
              <p>Welcome back! Please login to your account</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" fullWidth loading={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="login-footer">
              <p>Demo Credentials: john_doe / password123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="app">
      <ToastContainer />

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v2h20V7l-10-5zm-8 7v10h2V9H4zm4 0v10h2V9H8zm4 0v10h2V9h-2zm4 0v10h2V9h-2zm4 0v10h2V9h-2zM2 21h20v2H2v-2z" />
          </svg>
          <span>SecureBank</span>
        </div>

        <div className="nav-menu">
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
          </button>
          <button
            className={activeView === 'accounts' ? 'active' : ''}
            onClick={() => setActiveView('accounts')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
            Accounts
          </button>
          <button
            className={activeView === 'transactions' ? 'active' : ''}
            onClick={() => setActiveView('transactions')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
            Transactions
          </button>
          <button
            className={activeView === 'profile' ? 'active' : ''}
            onClick={() => setActiveView('profile')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            Profile
          </button>
        </div>

        <div className="nav-user">
          <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
            <span className="notification-badge">3</span>
          </button>
          <Avatar name={loggedInUser?.username || 'User'} size="md" />
          <span className="user-name">{loggedInUser?.username}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="dashboard animate-fadeIn">
            <div className="dashboard-header">
              <div>
                <h2>Welcome back, {loggedInUser?.username}!</h2>
                <p className="dashboard-subtitle">Here's your financial overview</p>
              </div>
              <div className="quick-actions">
                <Button variant="primary" size="sm">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                  </svg>
                  Transfer
                </Button>
                <Button variant="outline" size="sm">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />
                  </svg>
                  Pay Bills
                </Button>
              </div>
            </div>

            {/* Account Cards */}
            <div className="account-cards-grid">
              {mockAccounts.map((account) => (
                <Card key={account.id} variant="glass" hoverable>
                  <div className="account-card-header">
                    <div>
                      <div className="account-type">{account.type}</div>
                      <div className="account-number">{account.number}</div>
                    </div>
                    <Badge variant={account.balance >= 0 ? 'success' : 'error'}>
                      {account.change >= 0 ? '+' : ''}{account.change}%
                    </Badge>
                  </div>
                  <div className="account-balance">
                    {formatCurrency(Math.abs(account.balance))}
                  </div>
                  <MiniChart data={mockBalanceData} color={account.balance >= 0 ? '#10b981' : '#ef4444'} />
                </Card>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <Card>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-primary">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Balance</div>
                    <div className="stat-value">{formatCurrency(38750.50)}</div>
                    <div className="stat-change positive">+12.5% from last month</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-success">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14l5-5 5 5H7z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Income (30 days)</div>
                    <div className="stat-value">{formatCurrency(12500.00)}</div>
                    <div className="stat-change positive">+8.2% from last month</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-error">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Expenses (30 days)</div>
                    <div className="stat-value">{formatCurrency(3250.75)}</div>
                    <div className="stat-change negative">+15.3% from last month</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-info">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Transactions</div>
                    <div className="stat-value">127</div>
                    <div className="stat-change positive">+23 this month</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <div className="card-header">
                <h3 className="card-title">Recent Transactions</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('transactions')}>
                  View All
                </Button>
              </div>
              <div className="transactions-list">
                {mockRecentTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className={`transaction-icon ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-description">{transaction.description}</div>
                      <div className="transaction-date">{formatSmartDate(transaction.date)}</div>
                    </div>
                    <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Accounts View */}
        {activeView === 'accounts' && (
          <div className="section animate-fadeIn">
            <h2>Search Account</h2>
            <p className="section-subtitle">Find account information by account number</p>

            <form onSubmit={handleAccountSearch} className="search-form">
              <input
                type="text"
                placeholder="Enter account number"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                required
              />
              <Button type="submit" loading={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {accountResults && (
              <Card className="result-card">
                <h3 className="card-title">Search Results</h3>
                <pre>{JSON.stringify(accountResults, null, 2)}</pre>
              </Card>
            )}
          </div>
        )}

        {/* Transactions View */}
        {activeView === 'transactions' && (
          <div className="section animate-fadeIn">
            <h2>Transaction History</h2>
            <p className="section-subtitle">View and search your transaction history</p>

            <div className="transaction-filters">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer">Transfers</option>
                <option value="payment">Payments</option>
              </select>
            </div>

            <form onSubmit={handleTransactions} className="search-form">
              <input
                type="text"
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
              <Button type="submit" loading={loading}>
                {loading ? 'Loading...' : 'Get Transactions'}
              </Button>
            </form>

            {transactionResults && (
              <Card className="result-card">
                <h3 className="card-title">Transaction History</h3>
                <pre>{JSON.stringify(transactionResults, null, 2)}</pre>
              </Card>
            )}
          </div>
        )}

        {/* Profile View */}
        {activeView === 'profile' && (
          <div className="section animate-fadeIn">
            <h2>Profile Settings</h2>
            <p className="section-subtitle">Manage your account information</p>

            <div className="profile-grid">
              <Card>
                <div className="profile-section">
                  <div className="profile-avatar-section">
                    <Avatar name={loggedInUser?.username || 'User'} size="xl" />
                    <div className="profile-info">
                      <h3>{loggedInUser?.username}</h3>
                      <p>{loggedInUser?.email || 'user@securebank.com'}</p>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="card-title">Account Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Username</label>
                    <div>{loggedInUser?.username}</div>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <div>{loggedInUser?.email || 'user@securebank.com'}</div>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <div>{loggedInUser?.role || 'Customer'}</div>
                  </div>
                  <div className="info-item">
                    <label>Member Since</label>
                    <div>January 2024</div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="card-title">Security Settings</h3>
                <div className="settings-list">
                  <div className="setting-item">
                    <div>
                      <div className="setting-label">Two-Factor Authentication</div>
                      <div className="setting-description">Add an extra layer of security</div>
                    </div>
                    <Badge variant="warning">Not Enabled</Badge>
                  </div>
                  <div className="setting-item">
                    <div>
                      <div className="setting-label">Login Notifications</div>
                      <div className="setting-description">Get notified of new logins</div>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
