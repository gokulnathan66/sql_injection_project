-- Create database schema for vulnerable banking application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users (passwords are plain text for demo purposes)
INSERT INTO users (username, password, email, role) VALUES
('admin', 'admin123', 'admin@bank.com', 'admin'),
('john_doe', 'password123', 'john@example.com', 'user'),
('jane_smith', 'pass456', 'jane@example.com', 'user'),
('bob_wilson', 'bob789', 'bob@example.com', 'user'),
('alice_brown', 'alice321', 'alice@example.com', 'user');

-- Insert sample accounts
INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES
(1, '1000000001', 'checking', 50000.00),
(2, '1234567890', 'checking', 15000.50),
(2, '1234567891', 'savings', 25000.00),
(3, '2345678901', 'checking', 8500.75),
(3, '2345678902', 'savings', 45000.00),
(4, '3456789012', 'checking', 3200.25),
(5, '4567890123', 'checking', 12000.00),
(5, '4567890124', 'savings', 78000.50);

-- Insert sample transactions
INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES
(1, 'deposit', 10000.00, 'Initial deposit'),
(2, 'deposit', 5000.00, 'Salary deposit'),
(2, 'withdrawal', 500.00, 'ATM withdrawal'),
(2, 'transfer', -1000.00, 'Transfer to savings'),
(3, 'transfer', 1000.00, 'Transfer from checking'),
(4, 'deposit', 3000.00, 'Freelance payment'),
(4, 'withdrawal', 200.00, 'Shopping'),
(5, 'deposit', 15000.00, 'Bonus'),
(6, 'withdrawal', 100.00, 'Grocery'),
(7, 'deposit', 2000.00, 'Refund'),
(8, 'deposit', 50000.00, 'Investment return');

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_users_username ON users(username);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bankuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bankuser;

-- Display summary
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_accounts FROM accounts;
SELECT COUNT(*) as total_transactions FROM transactions;
