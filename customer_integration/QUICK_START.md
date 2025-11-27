# Quick Start Guide - Customer Integration Demo

## ✅ System Status: RUNNING

All services are up and configured!

## 🌐 Access Points

| Service | URL | Status |
|---------|-----|--------|
| **Vulnerable Banking App** | http://localhost:3001 | ✅ Running |
| **Backend API** | http://localhost:5000 | ✅ Running (Protected) |
| **Detection System** | http://localhost:8000 | ✅ Running |
| **Detection Dashboard** | http://localhost:3000 | ✅ Running |
| **Database** | localhost:5433 | ✅ Running |

## 🎯 Quick Test

### 1. Open Banking App
```bash
open http://localhost:3001
```

### 2. Try SQL Injection Attack

**Attack Payload:**
```
Username: admin' OR '1'='1'--
Password: anything
```

**Expected Result:** ❌ Blocked by detection system
```json
{
  "error": "Security violation detected",
  "attack_type": "boolean_blind",
  "confidence": 0.95
}
```

### 3. Try Legitimate Login

**Normal Login:**
```
Username: john_doe
Password: password123
```

**Expected Result:** ✅ Login successful
```json
{
  "success": true,
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

## 🧪 Test via Command Line

### Test 1: SQL Injection (Blocked)
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"anything"}'
```

**Result:**
```json
{
  "error": "Security violation detected",
  "attack_type": "boolean_blind",
  "confidence": 0.95
}
```

### Test 2: Legitimate Query (Allowed)
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}'
```

**Result:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "username": "john_doe"
  }
}
```

### Test 3: Union-based Injection (Blocked)
```bash
curl "http://localhost:5000/api/accounts?account_number='\%20UNION\%20SELECT\%20username,password,email,role,id\%20FROM\%20users--"
```

### Test 4: Account Search (Allowed)
```bash
curl "http://localhost:5000/api/accounts?account_number=1234567890"
```

## 📊 View Detection Dashboard

Open the dashboard to see real-time attack monitoring:
```bash
open http://localhost:3000
```

You'll see:
- Live attack feed
- Statistics (total queries, attacks detected)
- Attack type distribution
- Timeline of attacks

## 🔧 Configuration

### Current Setup
- **Protection:** ✅ ENABLED
- **Detection API:** http://host.docker.internal:8000
- **Backend:** Calls detection system for every request
- **Database:** PostgreSQL with sample banking data

### Toggle Protection

**Disable Protection (Show Vulnerability):**
```bash
# Edit docker-compose.yml
USE_PROTECTION: "false"

# Restart
docker-compose restart backend
```

**Enable Protection (Show Defense):**
```bash
# Edit docker-compose.yml
USE_PROTECTION: "true"

# Restart
docker-compose restart backend
```

## 📝 Sample Data

### Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | pass456 | user |
| bob_wilson | bob789 | user |
| alice_brown | alice321 | user |

### Accounts
| Account Number | User | Balance |
|----------------|------|---------|
| 1000000001 | admin | $50,000 |
| 1234567890 | john_doe | $15,000 |
| 2345678901 | jane_smith | $8,500 |
| 3456789012 | bob_wilson | $3,200 |
| 4567890123 | alice_brown | $12,000 |

## 🎯 Attack Scenarios to Test

### 1. Authentication Bypass
```
Username: admin' OR '1'='1'--
Password: anything
```

### 2. Data Extraction
```
Account: ' UNION SELECT username, password, email, role, id FROM users--
```

### 3. Boolean-blind
```
User ID: 1 OR 1=1
```

### 4. Time-based
```
User ID: 1 AND pg_sleep(5)--
```

### 5. LIKE Injection
```
Username: %' OR '1'='1
```

## 🛑 Stop Services

```bash
cd customer_integration
docker-compose down
```

## 🔄 Restart Services

```bash
cd customer_integration
docker-compose restart
```

## 📋 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs customer_backend -f
docker logs customer_frontend -f
docker logs customer_database -f
```

## 🎓 For Demonstration

**Step 1: Show Vulnerability**
1. Disable protection: `USE_PROTECTION: "false"`
2. Restart backend: `docker-compose restart backend`
3. Try SQL injection: `admin' OR '1'='1'--`
4. Show it succeeds ❌

**Step 2: Show Protection**
1. Enable protection: `USE_PROTECTION: "true"`
2. Restart backend: `docker-compose restart backend`
3. Try same SQL injection
4. Show it's blocked ✅

**Step 3: Show Monitoring**
1. Open dashboard: http://localhost:3000
2. Execute attacks
3. Show real-time detection
4. Display statistics

## ✅ Verification Checklist

- [x] Database initialized with sample data
- [x] Backend running with protection enabled
- [x] Frontend accessible at port 3001
- [x] Detection system responding at port 8000
- [x] Dashboard showing at port 3000
- [x] SQL injection attacks being blocked
- [x] Legitimate queries working
- [x] Real-time monitoring functional

## 🎉 Success!

Your customer integration demo is fully operational and ready for demonstration!

**Next Steps:**
1. Open http://localhost:3001 in browser
2. Test attack scenarios
3. View detection at http://localhost:3000
4. Capture screenshots for report
5. Document results

---

**Status:** ✅ All systems operational and configured correctly!
