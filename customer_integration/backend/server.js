const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

// Federated Learning Components
const LocalTrainingDatabase = require('./database/local_db');
const FederatedClient = require('./services/federated_client');

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
const ENABLE_FEDERATED = process.env.ENABLE_FEDERATED === 'true';

// Initialize Local Training Database (separate from main backend KB)
const localDb = new LocalTrainingDatabase(process.env.LOCAL_DB_PATH || './data/local_training.db');

// Initialize Federated Client
let federatedClient = null;
if (ENABLE_FEDERATED) {
  federatedClient = new FederatedClient(
    process.env.ORG_ID || 'customer_demo_001',
    process.env.ORG_NAME || 'Customer Demo Organization',
    process.env.COORDINATOR_URL || 'http://host.docker.internal:8000',
    process.env.FEDERATED_API_KEY || null
  );

  // Register with coordinator on startup
  federatedClient.register().then(success => {
    if (success) {
      console.log('✓ Federated learning client registered');
      
      // Update federated status in local DB
      localDb.updateFederatedStatus(
        federatedClient.orgId,
        federatedClient.coordinatorUrl,
        0,
        'registered'
      );

      // Start periodic federated learning cycle
      const trainingInterval = parseInt(process.env.FEDERATED_TRAINING_INTERVAL || '3600000'); // Default: 1 hour
      
      const runFederatedCycle = async () => {
        try {
          console.log(`[${federatedClient.orgId}] Starting federated learning cycle`);
          
          // Step 1: Download global model
          const downloaded = await federatedClient.downloadGlobalModel();
          if (!downloaded) {
            console.log(`[${federatedClient.orgId}] Failed to download model, skipping cycle`);
            return;
          }

          // Step 2: Train and upload
          await federatedClient.trainAndUpload(localDb);
          
          // Update status
          await localDb.updateFederatedStatus(
            federatedClient.orgId,
            federatedClient.coordinatorUrl,
            federatedClient.currentRound,
            'synced'
          );
        } catch (error) {
          console.error(`[${federatedClient.orgId}] Federated cycle error:`, error.message);
        }
      };

      // Run immediately on startup (after delay)
      setTimeout(runFederatedCycle, 30000); // Wait 30 seconds for system to stabilize
      
      // Then run periodically
      setInterval(runFederatedCycle, trainingInterval);
      console.log(`✓ Federated learning cycle scheduled (interval: ${trainingInterval}ms)`);
    } else {
      console.log('⚠ Federated learning client registration failed');
    }
  });
}

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

    // Store in LOCAL database for federated learning (separate from main KB)
    if (ENABLE_FEDERATED && localDb) {
      try {
        await localDb.storeLocalAttack({
          query: testQuery,
          normalized_query: response.data.normalized_query,
          is_malicious: response.data.is_malicious,
          confidence: response.data.confidence || 0.0,
          attack_type: response.data.attack_type,
          source_ip: req.ip,
          user_agent: req.get('user-agent'),
          response_time_ms: response.data.response_time_ms
        });
      } catch (dbError) {
        console.error('Error storing in local DB:', dbError.message);
        // Don't fail the request if local DB fails
      }
    }

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
  res.json({ 
    status: 'healthy', 
    protection: USE_PROTECTION,
    federated_learning: ENABLE_FEDERATED
  });
});

// Federated learning status endpoint
app.get('/api/federated/status', async (req, res) => {
  if (!ENABLE_FEDERATED || !federatedClient) {
    return res.json({
      enabled: false,
      message: 'Federated learning is not enabled'
    });
  }

  try {
    const localStatus = await localDb.getFederatedStatus();
    const clientStatus = federatedClient.getStatus();
    const stats = await localDb.getStatistics();

    res.json({
      enabled: true,
      client: clientStatus,
      local_status: localStatus,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      enabled: true,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Vulnerable banking API running on port ${PORT}`);
  console.log(`SQL Injection Protection: ${USE_PROTECTION ? 'ENABLED' : 'DISABLED'}`);
});
