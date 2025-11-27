# SQL Injection Test Commands for Customer Frontend

## 🎯 Testing Instructions

Open the banking app at: **http://localhost:3001**

---

## 1️⃣ LOGIN PAGE - Authentication Bypass

### ✅ Normal Login (Should Work)
```
Username: john_doe
Password: password123
```

### ❌ SQL Injection Attack #1 - OR 1=1
```
Username: admin' OR '1'='1'--
Password: anything
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #2 - Comment Bypass
```
Username: admin'--
Password: (leave empty)
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #3 - Always True
```
Username: ' OR 'a'='a
Password: ' OR 'a'='a
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #4 - UNION Based
```
Username: admin' UNION SELECT 1,2,3,4,5--
Password: anything
```
**Expected:** Blocked by detection system

---

## 2️⃣ ACCOUNTS PAGE - Data Extraction

### ✅ Normal Search (Should Work)
```
Account Number: 1234567890
```

### ❌ SQL Injection Attack #1 - UNION SELECT
```
Account Number: ' UNION SELECT username, password, email, role, id FROM users--
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #2 - Information Schema
```
Account Number: ' UNION SELECT table_name, column_name, NULL, NULL, NULL FROM information_schema.columns--
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #3 - Database Enumeration
```
Account Number: ' UNION SELECT database(), user(), version(), NULL, NULL--
```
**Expected:** Blocked by detection system

---

## 3️⃣ TRANSACTIONS PAGE - Boolean-blind Injection

### ✅ Normal Query (Should Work)
```
User ID: 2
```

### ❌ SQL Injection Attack #1 - OR 1=1
```
User ID: 1 OR 1=1
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #2 - AND 1=2
```
User ID: 1 AND 1=2
```
**Expected:** Blocked by detection system

### ❌ SQL Injection Attack #3 - Time-based Blind
```
User ID: 1 AND pg_sleep(5)--
```
**Expected:** Blocked by detection system (with 5 second delay if not protected)

### ❌ SQL Injection Attack #4 - Subquery
```
User ID: 1 AND (SELECT COUNT(*) FROM users) > 0
```
**Expected:** Blocked by detection system

---

## 📊 Command Line Testing

### Test Login Endpoint

**Normal Login:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}'
```

**SQL Injection Attack:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"anything"}'
```

### Test Account Search Endpoint

**Normal Search:**
```bash
curl "http://localhost:5000/api/accounts?account_number=1234567890"
```

**SQL Injection Attack:**
```bash
curl "http://localhost:5000/api/accounts?account_number='\%20UNION\%20SELECT\%20username,password,email,role,id\%20FROM\%20users--"
```

### Test Transactions Endpoint

**Normal Query:**
```bash
curl "http://localhost:5000/api/transactions?user_id=2"
```

**SQL Injection Attack:**
```bash
curl "http://localhost:5000/api/transactions?user_id=1\%20OR\%201=1"
```

---

## 🎭 Demo Scenario

### Scenario 1: Show Vulnerability (Protection OFF)

1. **Disable Protection:**
   ```bash
   # Edit docker-compose.yml
   USE_PROTECTION: "false"
   
   # Restart backend
   docker-compose restart backend
   ```

2. **Execute Attack:**
   - Username: `admin' OR '1'='1'--`
   - Password: `anything`
   - **Result:** ✅ Login succeeds (VULNERABILITY!)

### Scenario 2: Show Protection (Protection ON)

1. **Enable Protection:**
   ```bash
   # Edit docker-compose.yml
   USE_PROTECTION: "true"
   
   # Restart backend
   docker-compose restart backend
   ```

2. **Execute Same Attack:**
   - Username: `admin' OR '1'='1'--`
   - Password: `anything`
   - **Result:** ❌ Blocked with error message (PROTECTED!)

---

## 📈 Expected Results

### With Protection ENABLED (Current State)

| Attack Type | Input | Result |
|-------------|-------|--------|
| OR 1=1 | `admin' OR '1'='1'--` | ❌ Blocked (95% confidence) |
| Comment Bypass | `admin'--` | ❌ Blocked (92% confidence) |
| UNION SELECT | `' UNION SELECT...` | ❌ Blocked (98% confidence) |
| Boolean-blind | `1 OR 1=1` | ❌ Blocked (89% confidence) |
| Time-based | `1 AND pg_sleep(5)--` | ❌ Blocked (91% confidence) |

### With Protection DISABLED

| Attack Type | Input | Result |
|-------------|-------|--------|
| OR 1=1 | `admin' OR '1'='1'--` | ✅ Succeeds - Logs in as admin |
| Comment Bypass | `admin'--` | ✅ Succeeds - Bypasses password |
| UNION SELECT | `' UNION SELECT...` | ✅ Succeeds - Exposes all users |
| Boolean-blind | `1 OR 1=1` | ✅ Succeeds - Returns all data |
| Time-based | `1 AND pg_sleep(5)--` | ✅ Succeeds - 5 second delay |

---

## 🔍 Monitoring

### View Detection Dashboard
```
http://localhost:3000
```

### Check Detection Stats
```bash
curl http://localhost:8000/api/stats
```

### View Recent Attacks
```bash
curl http://localhost:8000/api/attacks?limit=10
```

---

## 📝 Sample Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | pass456 | user |
| bob_wilson | bob789 | user |
| alice_brown | alice321 | user |

---

## ⚠️ Important Notes

1. **Current State:** Protection is ENABLED
2. **All attacks will be blocked** with error messages
3. **Legitimate queries will work** normally
4. **View attacks in real-time** at http://localhost:3000
5. **Toggle protection** by editing `docker-compose.yml`

---

## 🎓 For Project Demonstration

**Step 1:** Show vulnerability (protection OFF)
**Step 2:** Show protection (protection ON)
**Step 3:** Show monitoring dashboard
**Step 4:** Show detection statistics

**Perfect for demonstrating the effectiveness of your ML-based SQL injection detection system!**
