# SQL Injection Testing Guide

Complete guide to test SQL injection attacks and protection mechanisms.

## 🚀 Setup

```bash
cd customer_integration
docker-compose up --build
```

Wait for all services to start:
- ✅ Database initialized
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3001
- ✅ Detection system on port 8000
- ✅ Detection dashboard on port 3000

## 📊 Testing Modes

### Mode 1: Vulnerable (No Protection)

**Configuration:**
```yaml
# docker-compose.yml
backend:
  environment:
    USE_PROTECTION: "false"

frontend:
  environment:
    VITE_API_URL: http://localhost:5000
```

**Expected:** All SQL injection attacks succeed ❌

### Mode 2: Protected (With Our System)

**Configuration:**
```yaml
# docker-compose.yml
backend:
  environment:
    USE_PROTECTION: "true"

frontend:
  environment:
    VITE_API_URL: http://localhost:8000/proxy
```

**Expected:** All SQL injection attacks blocked ✅

## 🎯 Test Scenarios

### Scenario 1: Authentication Bypass

**Objective:** Bypass login without valid credentials

**Normal Login:**
```
Username: john_doe
Password: password123
Result: ✅ Login successful
```

**Attack 1: OR 1=1**
```
Username: admin' OR '1'='1'--
Password: anything
SQL Query: SELECT * FROM users WHERE username = 'admin' OR '1'='1'--' AND password = 'anything'
Result (No Protection): ✅ Logged in as admin
Result (With Protection): ❌ Blocked - Confidence: 95%
```

**Attack 2: Comment Injection**
```
Username: admin'--
Password: (empty)
SQL Query: SELECT * FROM users WHERE username = 'admin'--' AND password = ''
Result (No Protection): ✅ Logged in as admin
Result (With Protection): ❌ Blocked - Confidence: 92%
```

**Attack 3: Always True**
```
Username: ' OR 'a'='a
Password: ' OR 'a'='a
SQL Query: SELECT * FROM users WHERE username = '' OR 'a'='a' AND password = '' OR 'a'='a'
Result (No Protection): ✅ Logged in
Result (With Protection): ❌ Blocked - Confidence: 97%
```

### Scenario 2: Data Extraction (Union-based)

**Objective:** Extract sensitive data from other tables

**Normal Search:**
```
Account Number: 1234567890
Result: ✅ Shows account details
```

**Attack: Union Select**
```
Account Number: ' UNION SELECT username, password, email, role, id FROM users--
SQL Query: SELECT * FROM accounts WHERE account_number = '' UNION SELECT username, password, email, role, id FROM users--'
Result (No Protection): ✅ Exposes all usernames and passwords
Result (With Protection): ❌ Blocked - Attack Type: union_based, Confidence: 98%
```

**Attack: Information Schema**
```
Account Number: ' UNION SELECT table_name, column_name, NULL, NULL, NULL FROM information_schema.columns--
SQL Query: Extracts database schema
Result (No Protection): ✅ Reveals database structure
Result (With Protection): ❌ Blocked - Confidence: 96%
```

### Scenario 3: Boolean-based Blind SQL Injection

**Objective:** Extract data through true/false responses

**Normal Query:**
```
User ID: 2
Result: ✅ Shows transactions
```

**Attack: OR 1=1**
```
User ID: 1 OR 1=1
SQL Query: SELECT * FROM transactions WHERE user_id = 1 OR 1=1
Result (No Protection): ✅ Shows ALL transactions
Result (With Protection): ❌ Blocked - Attack Type: boolean_blind, Confidence: 89%
```

**Attack: AND 1=2**
```
User ID: 1 AND 1=2
SQL Query: SELECT * FROM transactions WHERE user_id = 1 AND 1=2
Result (No Protection): ✅ Returns empty (false condition)
Result (With Protection): ❌ Blocked - Confidence: 87%
```

### Scenario 4: Time-based Blind SQL Injection

**Objective:** Confirm vulnerability through delays

**Attack: pg_sleep**
```
User ID: 1 AND pg_sleep(5)--
SQL Query: SELECT * FROM transactions WHERE user_id = 1 AND pg_sleep(5)--
Result (No Protection): ✅ Response delayed by 5 seconds
Result (With Protection): ❌ Blocked - Attack Type: time_based, Confidence: 91%
```

### Scenario 5: LIKE Injection

**Objective:** Bypass search filters

**Normal Search:**
```
Username: john
Result: ✅ Shows john_doe
```

**Attack: Wildcard Injection**
```
Username: %' OR '1'='1
SQL Query: SELECT * FROM users WHERE username LIKE '%%' OR '1'='1%'
Result (No Protection): ✅ Returns all users
Result (With Protection): ❌ Blocked - Confidence: 93%
```

## 📈 Monitoring

### View Attacks in Real-time

1. **Detection Dashboard**: http://localhost:3000
   - Live attack feed
   - Statistics
   - Attack type distribution

2. **API Endpoints**:
   ```bash
   # Get statistics
   curl http://localhost:8000/api/stats
   
   # Get recent attacks
   curl http://localhost:8000/api/attacks?limit=10
   
   # Get timeline
   curl http://localhost:8000/api/timeline?hours=1
   ```

3. **Backend Logs**:
   ```bash
   docker logs customer_backend -f
   ```

## 🧪 Automated Testing

### Test Script

```bash
#!/bin/bash

echo "Testing SQL Injection Attacks..."

# Test 1: Login Bypass
echo "\n1. Testing Login Bypass..."
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"anything"}'

# Test 2: Union-based
echo "\n2. Testing Union-based Injection..."
curl "http://localhost:5000/api/accounts?account_number='\%20UNION\%20SELECT\%20username,password,email,role,id\%20FROM\%20users--"

# Test 3: Boolean-blind
echo "\n3. Testing Boolean-blind..."
curl "http://localhost:5000/api/transactions?user_id=1\%20OR\%201=1"

# Test 4: Time-based
echo "\n4. Testing Time-based..."
curl "http://localhost:5000/api/transactions?user_id=1\%20AND\%20pg_sleep(5)--"

echo "\n\nCheck detection dashboard at http://localhost:3000"
```

## 📊 Expected Results

### Without Protection

| Test | Status | Impact |
|------|--------|--------|
| Login Bypass | ❌ Succeeds | Unauthorized access |
| Union-based | ❌ Succeeds | Data breach |
| Boolean-blind | ❌ Succeeds | Data enumeration |
| Time-based | ❌ Succeeds | Vulnerability confirmed |
| LIKE Injection | ❌ Succeeds | Filter bypass |

**Total Attacks Blocked:** 0/5 (0%)

### With Protection

| Test | Status | Confidence | Response Time |
|------|--------|-----------|---------------|
| Login Bypass | ✅ Blocked | 95% | <50ms |
| Union-based | ✅ Blocked | 98% | <50ms |
| Boolean-blind | ✅ Blocked | 89% | <50ms |
| Time-based | ✅ Blocked | 91% | <50ms |
| LIKE Injection | ✅ Blocked | 93% | <50ms |

**Total Attacks Blocked:** 5/5 (100%)

## 🎓 Learning Points

1. **SQL Injection Impact**: See real data breaches
2. **Attack Techniques**: Understand different injection methods
3. **Detection Mechanism**: ML-based pattern recognition
4. **Real-time Protection**: <50ms detection latency
5. **Monitoring**: Complete visibility into attacks

## 🔧 Troubleshooting

### Services Not Starting
```bash
docker-compose down -v
docker-compose up --build
```

### Database Connection Issues
```bash
docker exec -it customer_database psql -U bankuser -d bankdb
```

### View Logs
```bash
docker logs customer_backend
docker logs detection_system
docker logs customer_frontend
```

## 📝 Report Generation

After testing, generate a report:

```bash
# Get attack statistics
curl http://localhost:8000/api/stats > attack_stats.json

# Get attack history
curl http://localhost:8000/api/attacks?limit=100 > attack_history.json

# Get timeline
curl http://localhost:8000/api/timeline?hours=24 > attack_timeline.json
```

## ⚠️ Security Notice

This is a deliberately vulnerable application for educational purposes:
- Never use in production
- Run only in isolated environments
- For demonstration and learning only
- Contains real SQL injection vulnerabilities

## 🎯 Success Criteria

✅ All SQL injection attacks detected
✅ <50ms detection latency
✅ Real-time alerts working
✅ Complete audit trail
✅ Zero false positives on legitimate queries
✅ Dashboard showing live attacks
