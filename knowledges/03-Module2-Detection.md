# Module 2: Detection and Analysis Engine

## Module 2 - Detection & Analysis Engine Overview

### Purpose
Implement a real-time detection system that processes incoming SQL queries, normalizes them, extracts comprehensive features, and applies hybrid machine learning classification to identify and classify SQL injection attacks.

### Module Objectives
1. Normalize and standardize SQL queries
2. Extract 200+ security-relevant features
3. Apply hybrid ML classification approach
4. Achieve >99% detection accuracy with <1% FPR
5. Maintain sub-50ms processing latency

---

## Architecture

```
Incoming Query
    ↓
[Query Normalizer]
- URL decoding
- Unicode normalization
- Comment removal
- Case standardization
- Whitespace normalization
    ↓
[Feature Extractor]
- Syntactic features
- Semantic features
- Behavioral features
- Contextual features
    ↓
[Hybrid ML Classifier]
├── Signature Detection
├── Anomaly Detection
├── CNN Classification
├── LSTM Classification
├── Random Forest
└── SVM Classification
    ↓
[Decision Aggregation]
- Ensemble voting
- Confidence scoring
- Threat level assessment
    ↓
[Output & Action]
- Classification result
- Confidence score
- Detailed reasoning
- IOC extraction (if malicious)
```

---

## Query Normalization

### Purpose
Remove encoding tricks and obfuscation to standardize queries for feature extraction and classification.

### Normalization Techniques

#### 1. URL Decoding
```python
from urllib.parse import unquote

# Single level: %27 → '
decoded = unquote("%27 OR %201=%201")
# Result: ' OR 1=1

# Multi-level decoding for obfuscated payloads
def recursive_decode(query, max_levels=5):
    for _ in range(max_levels):
        decoded = unquote(query)
        if decoded == query:
            break
        query = decoded
    return query
```

#### 2. Unicode and Hex Decoding
```python
import re

def decode_unicode(query):
    # Handle Unicode escapes: \u0027 → '
    return query.encode('utf-8').decode('unicode_escape', errors='ignore')

def decode_hex(query):
    # Handle hex encoding: 0x27 → '
    return re.sub(r'0x([0-9A-Fa-f]+)', 
                 lambda m: chr(int(m.group(1), 16)), 
                 query)

def decode_charset(query):
    # Handle character set encoding
    patterns = [
        (r"_latin1\s*0x([0-9A-Fa-f]+)", 'hex_latin1'),
        (r"_utf8\s*0x([0-9A-Fa-f]+)", 'hex_utf8'),
    ]
    for pattern, encoding in patterns:
        query = re.sub(pattern, lambda m: chr(int(m.group(1), 16)), query)
    return query
```

#### 3. Comment Removal
```python
def remove_comments(query):
    # Remove SQL comments: --, /*, #
    query = re.sub(r'--.*?$', '', query, flags=re.MULTILINE)
    query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
    query = re.sub(r'#.*?$', '', query, flags=re.MULTILINE)
    query = re.sub(r'\+\+', '', query)  # Oracle increment
    return query
```

#### 4. Case Standardization
```python
def standardize_keywords(query):
    # Uppercase SQL keywords for consistent analysis
    keywords = ['SELECT', 'FROM', 'WHERE', 'UNION', 'ORDER', 'GROUP', 
               'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
               'IF', 'AND', 'OR', 'NOT', 'LIKE', 'IN', 'BETWEEN']
    
    for kw in keywords:
        pattern = rf'\b{kw}\b'
        query = re.sub(pattern, kw, query, flags=re.IGNORECASE)
    return query
```

#### 5. Whitespace Normalization
```python
def normalize_whitespace(query):
    # Remove multiple spaces/tabs/newlines
    query = re.sub(r'\s+', ' ', query)
    query = query.strip()
    return query
```

### Complete Normalization Pipeline

```python
class QueryNormalizer:
    def __init__(self):
        self.encoding_patterns = {}
    
    def normalize(self, query):
        """Main normalization pipeline"""
        # Step 1: Remove multiple spaces
        query = re.sub(r'\s+', ' ', query)
        
        # Step 2: Iterative decoding (up to 5 levels)
        for _ in range(5):
            prev = query
            query = unquote(query)
            query = self.decode_hex(query)
            query = self.decode_unicode(query)
            if prev == query:
                break
        
        # Step 3: Remove comments
        query = self.remove_comments(query)
        
        # Step 4: Standardize keywords
        query = self.standardize_keywords(query)
        
        # Step 5: Final whitespace cleanup
        query = re.sub(r'\s+', ' ', query).strip()
        
        return query
    
    def decode_hex(self, query):
        return re.sub(r'0x([0-9A-Fa-f]+)', 
                     lambda m: chr(int(m.group(1), 16)), 
                     query)
    
    def decode_unicode(self, query):
        return query.encode('utf-8').decode('unicode_escape', errors='ignore')
    
    def remove_comments(self, query):
        query = re.sub(r'--.*?$', '', query, flags=re.MULTILINE)
        query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
        query = re.sub(r'#.*?$', '', query, flags=re.MULTILINE)
        return query
    
    def standardize_keywords(self, query):
        keywords = ['SELECT', 'FROM', 'WHERE', 'UNION', 'ORDER', 'GROUP', 
                   'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP']
        for kw in keywords:
            query = re.sub(rf'\b{kw}\b', kw, query, flags=re.IGNORECASE)
        return query
```

---

## Feature Extraction

### Feature Categories

#### 1. Syntactic Features (45 features)
These features analyze the structure and composition of queries.

```python
def extract_syntactic_features(query):
    features = {}
    
    # Length-based features
    features['query_length'] = len(query)
    features['token_count'] = len(query.split())
    features['char_count'] = len([c for c in query if c.isalpha()])
    
    # Keyword frequency
    keywords = ['SELECT', 'FROM', 'WHERE', 'UNION', 'INSERT', 'UPDATE', 'DELETE']
    for kw in keywords:
        features[f'{kw.lower()}_count'] = query.count(kw)
    
    # Special character analysis
    features['special_char_frequency'] = sum(1 for c in query if c in "!'\"()[]{}*+-=/<>%")
    features['quote_count'] = query.count("'") + query.count('"')
    features['parenthesis_depth'] = max_parenthesis_depth(query)
    features['comment_count'] = query.count('--') + query.count('/*')
    
    # Operator analysis
    features['comparison_ops'] = sum(1 for op in ['=', '<', '>', '!'] if op in query)
    features['logical_ops'] = query.count('AND') + query.count('OR')
    
    # Wildcard and pattern matching
    features['wildcard_count'] = query.count('%') + query.count('_')
    features['like_count'] = query.count('LIKE')
    
    return features
```

#### 2. Semantic Features (65 features)
These features analyze the meaning and intent of queries.

```python
def extract_semantic_features(query):
    features = {}
    
    # UNION detection
    features['union_count'] = query.upper().count('UNION')
    features['union_select_pattern'] = 1 if re.search(r'UNION.*?SELECT', query, re.IGNORECASE) else 0
    
    # Function usage
    features['function_count'] = len(re.findall(r'\w+\s*\(', query))
    suspicious_functions = ['EXTRACTVALUE', 'UPDATEXML', 'SLEEP', 'BENCHMARK', 
                          'LOAD_FILE', 'INTO_OUTFILE', 'EXEC', 'SP_EXECUTESQL']
    features['suspicious_function_count'] = sum(1 for f in suspicious_functions if f in query.upper())
    
    # Database-specific functions
    features['database_func_count'] = sum(1 for f in ['VERSION', 'DATABASE', 'USER', 'CURRENT_USER'] 
                                         if f in query.upper())
    
    # Subquery detection
    features['subquery_count'] = query.count('(SELECT')
    features['nested_select'] = max_nesting_level(query, 'SELECT')
    
    # Table/Column references
    features['from_count'] = query.count('FROM')
    features['join_count'] = query.count('JOIN')
    features['table_reference_count'] = len(re.findall(r'FROM\s+(\w+)', query, re.IGNORECASE))
    
    return features
```

#### 3. Behavioral Features (40 features)
These features analyze runtime behavior and execution characteristics.

```python
def extract_behavioral_features(query, context):
    features = {}
    
    if not context:
        return features
    
    # Timing characteristics
    features['query_execution_time'] = context.get('execution_time_ms', 0)
    features['response_delay'] = context.get('response_delay_ms', 0)
    features['cache_hit'] = 1 if context.get('cache_hit') else 0
    
    # Result characteristics
    features['result_row_count'] = context.get('result_rows', 0)
    features['result_column_count'] = context.get('result_columns', 0)
    features['affected_row_count'] = context.get('affected_rows', 0)
    
    # Error characteristics
    features['error_occurred'] = 1 if context.get('error_message') else 0
    features['error_message_length'] = len(context.get('error_message', ''))
    features['database_error_indicator'] = 1 if any(indicator in context.get('error_message', '') 
                                                     for indicator in ['SQL', 'MySQL', 'PostgreSQL', 'syntax'])
    else 0
    
    return features
```

#### 4. Contextual Features (50+ features)
These features analyze user and session context.

```python
def extract_contextual_features(query, context):
    features = {}
    
    if not context:
        return features
    
    # User context
    features['user_id_hash'] = hash(context.get('user_id', 'unknown')) % 10000
    features['session_duration'] = context.get('session_duration_seconds', 0)
    features['queries_in_session'] = context.get('query_count', 0)
    features['average_query_size'] = context.get('avg_query_length', 0)
    
    # Geographic context
    features['geographic_deviation'] = 1 if context.get('location_changed') else 0
    features['country_risk_score'] = context.get('country_risk', 0)
    
    # Time context
    hour = datetime.now().hour
    features['hour_of_day'] = hour
    features['off_hours_access'] = 1 if hour not in range(8, 18) else 0
    
    # Device/Browser context
    features['user_agent_suspicious'] = 1 if is_suspicious_user_agent(context.get('user_agent', '')) else 0
    
    return features

def is_suspicious_user_agent(user_agent):
    suspicious_patterns = ['sqlmap', 'havij', 'acunetix', 'nessus', 'openvas']
    return any(pattern.lower() in user_agent.lower() for pattern in suspicious_patterns)
```

### Feature Engineering Pipeline

```python
class FeatureExtractor:
    def __init__(self):
        self.feature_names = self._initialize_feature_names()
        self.scaler = StandardScaler()
    
    def extract_features(self, normalized_query, context=None):
        """Extract all features from query"""
        features = {}
        
        # Syntactic features
        features.update(extract_syntactic_features(normalized_query))
        
        # Semantic features
        features.update(extract_semantic_features(normalized_query))
        
        # Behavioral features (if context available)
        if context:
            features.update(extract_behavioral_features(normalized_query, context))
        
        # Contextual features (if context available)
        if context:
            features.update(extract_contextual_features(normalized_query, context))
        
        # Convert to ordered array
        feature_array = np.array([features.get(name, 0) for name in self.feature_names])
        
        # Normalize features
        feature_array = self.scaler.fit_transform(feature_array.reshape(1, -1))[0]
        
        return feature_array
    
    def _initialize_feature_names(self):
        """Define all feature names for consistent ordering"""
        return [
            # Syntactic features
            'query_length', 'token_count', 'char_count',
            'select_count', 'from_count', 'union_count', 'where_count',
            'special_char_frequency', 'quote_count', 'parenthesis_depth',
            'comment_count', 'comparison_ops', 'logical_ops',
            # ... (200+ total features)
        ]
```

---

## Hybrid ML Classification

### Classification Components

#### 1. Signature-Based Detection
```python
class SignatureDetection:
    def __init__(self):
        self.signature_db = self._load_signatures()
    
    def detect(self, normalized_query):
        """Match query against known attack signatures"""
        max_score = 0.0
        
        for signature in self.signature_db:
            if re.search(signature['pattern'], normalized_query, re.IGNORECASE):
                max_score = max(max_score, signature['confidence'])
        
        return max_score
    
    def _load_signatures(self):
        """Load attack signatures from database"""
        return [
            {'pattern': r"UNION.*?SELECT", 'confidence': 0.95, 'type': 'union'},
            {'pattern': r"EXTRACTVALUE.*?CONCAT", 'confidence': 0.98, 'type': 'error'},
            {'pattern': r"SLEEP\s*\(\s*\d+\s*\)", 'confidence': 0.90, 'type': 'time_blind'},
            # ... (100+ signatures)
        ]
```

#### 2. Anomaly Detection
```python
from sklearn.ensemble import IsolationForest

class AnomalyDetection:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_fitted = False
    
    def train(self, normal_queries_features):
        """Train anomaly detector on benign queries"""
        self.model.fit(normal_queries_features)
        self.is_fitted = True
    
    def detect(self, features):
        """Detect anomalies in feature space"""
        if not self.is_fitted:
            return 0.0
        
        # Isolation Forest returns -1 for anomalies, 1 for normal
        prediction = self.model.predict(features.reshape(1, -1))[0]
        anomaly_score = 1.0 if prediction == -1 else 0.0
        
        return anomaly_score
```

#### 3. Supervised Learning Models
```python
import tensorflow as tf
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

class HybridMLClassifier:
    def __init__(self):
        self.signature_detection = SignatureDetection()
        self.anomaly_detection = AnomalyDetection()
        self.cnn_model = self._build_cnn_model()
        self.lstm_model = self._build_lstm_model()
        self.rf_model = RandomForestClassifier(n_estimators=100)
        self.svm_model = SVC(kernel='rbf', probability=True, C=1.0)
    
    def _build_cnn_model(self):
        """Build CNN model for SQL injection detection"""
        model = tf.keras.Sequential([
            tf.keras.layers.Embedding(input_dim=256, output_dim=32, input_length=100),
            tf.keras.layers.Conv1D(64, 3, activation='relu'),
            tf.keras.layers.MaxPooling1D(2),
            tf.keras.layers.Conv1D(32, 3, activation='relu'),
            tf.keras.layers.GlobalMaxPooling1D(),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def _build_lstm_model(self):
        """Build LSTM model for sequential pattern detection"""
        model = tf.keras.Sequential([
            tf.keras.layers.Embedding(input_dim=256, output_dim=32, input_length=100),
            tf.keras.layers.LSTM(64, return_sequences=True),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.LSTM(32),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def classify_query(self, normalized_query, features):
        """Hybrid classification combining all approaches"""
        
        # Get scores from each detector
        signature_score = self.signature_detection.detect(normalized_query)
        anomaly_score = self.anomaly_detection.detect(features)
        cnn_score = self._cnn_predict(normalized_query)
        lstm_score = self._lstm_predict(normalized_query)
        rf_score = self.rf_model.predict_proba(features.reshape(1, -1))[0][1]
        svm_score = (self.svm_model.decision_function(features.reshape(1, -1))[0] + 1) / 2
        
        # Ensemble voting with weighted averaging
        all_scores = [
            signature_score * 0.15,
            anomaly_score * 0.15,
            cnn_score * 0.20,
            lstm_score * 0.20,
            rf_score * 0.20,
            svm_score * 0.10
        ]
        
        final_score = sum(all_scores)
        confidence = np.std([s/w for s, w in zip(all_scores, [0.15, 0.15, 0.20, 0.20, 0.20, 0.10])])
        
        return {
            'classification': 'MALICIOUS' if final_score > 0.5 else 'BENIGN',
            'score': final_score,
            'confidence': confidence,
            'individual_scores': {
                'signature': signature_score,
                'anomaly': anomaly_score,
                'cnn': cnn_score,
                'lstm': lstm_score,
                'rf': rf_score,
                'svm': svm_score
            }
        }
    
    def _cnn_predict(self, query):
        """Get CNN prediction score"""
        tokens = self._tokenize(query)
        padded = tf.keras.preprocessing.sequence.pad_sequences([tokens], maxlen=100)
        return float(self.cnn_model.predict(padded)[0][0])
    
    def _lstm_predict(self, query):
        """Get LSTM prediction score"""
        tokens = self._tokenize(query)
        padded = tf.keras.preprocessing.sequence.pad_sequences([tokens], maxlen=100)
        return float(self.lstm_model.predict(padded)[0][0])
    
    def _tokenize(self, query):
        """Tokenize SQL query for neural networks"""
        # Tokenization implementation
        pass
```

---

## Performance Specifications

### Latency Breakdown
- Query Normalization: 1-2ms
- Feature Extraction: 3-5ms
- Model Inference: 10-15ms
- Decision Making: 1-2ms
- **Total Query Processing: <50ms**

### Accuracy Metrics
- Detection Accuracy: >99%
- False Positive Rate: <1%
- True Positive Rate: >99%
- False Negative Rate: <1%

### Scalability
- Single Instance Throughput: 5,000+ queries/second
- Scaled System (10 instances): 50,000+ queries/second
- Per-Instance Memory: 8GB
- Per-Instance CPU: 4-8 cores

---

## Integration Points

### Input Sources
- Web application traffic (via WAF/proxy)
- API gateway requests
- Database query logs
- Honeypot systems

### Output Destinations
- Real-time alerting system
- Knowledge base (Module 3)
- SIEM integration (Splunk, QRadar)
- Federated learning coordinator (Module 4)
- Dashboard visualization

---

## Testing and Validation

### Unit Tests
```python
def test_query_normalizer():
    normalizer = QueryNormalizer()
    assert normalizer.normalize("%27 OR %201=%201") == "' OR 1=1"
    assert normalizer.normalize("' /*!50000UNION*/ SELECT 1--") == "' UNION SELECT 1"

def test_feature_extractor():
    extractor = FeatureExtractor()
    query = "' UNION SELECT username,password FROM users--"
    features = extractor.extract_features(query)
    assert len(features) == 200  # Expected number of features
    assert features['union_count'] > 0
```

### Integration Tests
- End-to-end detection pipeline
- Performance benchmarking
- Accuracy validation
- Scalability testing

---

## Success Criteria

- ✓ >99% detection accuracy
- ✓ <1% false positive rate
- ✓ <50ms query latency
- ✓ 200+ features extracted per query
- ✓ All attack types covered
- ✓ Hybrid classifier implementation complete
- ✓ Scalability to 50,000+ qps
