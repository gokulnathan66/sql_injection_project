const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: 5432,
  database: 'bankdb',
  user: 'bankuser',
  password: 'bankpass123'
});

const DETECTION_API = process.env.DETECTION_API || 'http://localhost:8000';
const USE_PROTECTION = process.env.USE_PROTECTION === 'true';

// Middleware to check SQL injection if protection is enabled
async function checkSQLInjection(req, res, next) {
  if (!USE_PROTECTION) {
    return next();
  }

  try {
    const queryParams = JSON.stringify(req.query);
    const bodyParams = JSON.stringify(req.body);
    const testQuery = `${queryParams} ${bodyParams}`;

    const response = await axios.post(`${DETECTION_API}/api/detect`, {
      query: testQuery,
      source_ip: req.ip,
      user_agent: req.get('user-agent')
    });

    if (response.data.is_malicious) {
      return res.status(403).json({
        error: 'Security violation detected',
        message: 'Your request has been blocked for security reasons',
        attack_type: response.data.attack_type,
        confidence: response.data.confidence
      });
    }
    next();
  } catch (error) {
    console.error('Detection API error:', error.message);
    next(); // Continue if detection API is down
  }
}

// VULNERABLE: Login endpoint with SQL injection
app.post('/api/login', checkSQLInjection, async (req, res) => {
  const { username, password } = req.body;
  
  // VULNERABLE: Direct string concatenation
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  console.log('Executing query:', query);
  
  try {
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      res.json({
        success: true,
        user: {
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          role: result.rows[0].role
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABLE: Account search with SQL injection
app.get('/api/accounts', checkSQLInjection, async (req, res) => {
  const { account_number } = req.query;
  
  // VULNERABLE: Direct string concatenation
  const query = `SELECT * FROM accounts WHERE account_number = '${account_number}'`;
  
  console.log('Executing query:', query);
  
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABLE: Transaction history with SQL injection
app.get('/api/transactions', checkSQLInjection, async (req, res) => {
  const { user_id } = req.query;
  
  // VULNERABLE: Direct parameter injection
  const query = `SELECT * FROM transactions WHERE user_id = ${user_id} ORDER BY timestamp DESC`;
  
  console.log('Executing query:', query);
  
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABLE: User search
app.get('/api/users/search', checkSQLInjection, async (req, res) => {
  const { name } = req.query;
  
  // VULNERABLE: LIKE injection
  const query = `SELECT id, username, email, role FROM users WHERE username LIKE '%${name}%'`;
  
  console.log('Executing query:', query);
  
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', protection: USE_PROTECTION });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Vulnerable banking API running on port ${PORT}`);
  console.log(`SQL Injection Protection: ${USE_PROTECTION ? 'ENABLED' : 'DISABLED'}`);
});
