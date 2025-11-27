import { useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [searchAccount, setSearchAccount] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/accounts?account_number=${searchAccount}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/users/search?name=${searchUser}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactions = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/transactions?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const examplePayloads = {
    login: [
      { label: 'Normal Login', username: 'john_doe', password: 'password123' },
      { label: 'SQL Injection - OR 1=1', username: "admin' OR '1'='1'--", password: 'anything' },
      { label: 'SQL Injection - Comment', username: "admin'--", password: '' },
    ],
    account: [
      { label: 'Normal Search', value: '1234567890' },
      { label: 'SQL Injection - UNION', value: "' UNION SELECT username, password, email, role, id FROM users--" },
    ],
    user: [
      { label: 'Normal Search', value: 'john' },
      { label: 'SQL Injection - LIKE', value: "%' OR '1'='1" },
    ],
    transactions: [
      { label: 'Normal Query', value: '2' },
      { label: 'SQL Injection - OR', value: '1 OR 1=1' },
      { label: 'SQL Injection - Time-based', value: "1 AND pg_sleep(5)--" },
    ]
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🏦 Vulnerable Banking Application</h1>
        <p className="warning">⚠️ This is a deliberately vulnerable application for SQL injection demonstration</p>
      </header>

      <div className="tabs">
        <button className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>
          Login
        </button>
        <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>
          Account Search
        </button>
        <button className={activeTab === 'user' ? 'active' : ''} onClick={() => setActiveTab('user')}>
          User Search
        </button>
        <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
          Transactions
        </button>
      </div>

      <div className="content">
        {activeTab === 'login' && (
          <div className="tab-content">
            <h2>User Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              />
              <input
                type="text"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
            
            <div className="examples">
              <h3>Try These Examples:</h3>
              {examplePayloads.login.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setLoginData({ username: ex.username, password: ex.password })}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="tab-content">
            <h2>Account Search</h2>
            <form onSubmit={handleAccountSearch}>
              <input
                type="text"
                placeholder="Account Number"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            <div className="examples">
              <h3>Try These Examples:</h3>
              {examplePayloads.account.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setSearchAccount(ex.value)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'user' && (
          <div className="tab-content">
            <h2>User Search</h2>
            <form onSubmit={handleUserSearch}>
              <input
                type="text"
                placeholder="Username"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            <div className="examples">
              <h3>Try These Examples:</h3>
              {examplePayloads.user.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setSearchUser(ex.value)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="tab-content">
            <h2>Transaction History</h2>
            <form onSubmit={handleTransactions}>
              <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Get Transactions'}
              </button>
            </form>
            
            <div className="examples">
              <h3>Try These Examples:</h3>
              {examplePayloads.transactions.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setUserId(ex.value)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="result error">
            <h3>❌ Error</h3>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        {result && (
          <div className="result success">
            <h3>✅ Result</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
