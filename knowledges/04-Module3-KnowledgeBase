# Module 3: Knowledge Base and Threat Intelligence

## Module 3 - Knowledge Base Overview

### Purpose
Implement a centralized attack repository with sophisticated pattern analysis capabilities to store, correlate, and analyze SQL injection attacks, generating actionable threat intelligence for distribution across the security infrastructure.

### Module Objectives
1. Store comprehensive attack data and metadata
2. Perform attack pattern clustering and correlation
3. Automatically generate Indicators of Compromise (IOCs)
4. Integrate with external threat intelligence feeds
5. Support forensic investigation and attribution

---

## Database Schema

### Core Tables

#### attacks Table
```sql
CREATE TABLE attacks (
    id BIGSERIAL PRIMARY KEY,
    attack_id UUID UNIQUE NOT NULL,
    payload TEXT NOT NULL,
    payload_normalized TEXT,
    attack_type VARCHAR(50) NOT NULL,
    attack_subtype VARCHAR(100),
    success BOOLEAN NOT NULL,
    severity_level VARCHAR(20),
    confidence_score FLOAT,
    
    -- Source Information
    source_ip INET NOT NULL,
    source_port INTEGER,
    source_country VARCHAR(2),
    source_region VARCHAR(100),
    source_asn VARCHAR(20),
    source_isp VARCHAR(100),
    
    -- Target Information
    target_application VARCHAR(255),
    target_endpoint VARCHAR(255),
    target_parameter VARCHAR(255),
    target_database_type VARCHAR(50),
    target_database_version VARCHAR(100),
    
    -- Execution Details
    query_structure TEXT,
    database_queries_executed TEXT[],
    affected_tables TEXT[],
    data_accessed BOOLEAN,
    data_exfiltrated BOOLEAN,
    
    -- Timing Information
    request_timestamp TIMESTAMP NOT NULL,
    processing_time_ms INTEGER,
    response_time_ms INTEGER,
    
    -- Response Details
    response_code INTEGER,
    response_size_bytes INTEGER,
    error_message TEXT,
    database_version_extracted VARCHAR(100),
    
    -- Analysis Metadata
    evasion_techniques TEXT[],
    encoding_methods TEXT[],
    tools_used TEXT[],
    user_agent TEXT,
    attack_vectors TEXT[],
    
    -- Relationships
    campaign_id UUID,
    attacker_group_id UUID,
    related_attack_ids UUID[],
    
    -- Indexing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attacks_type ON attacks(attack_type);
CREATE INDEX idx_attacks_source_ip ON attacks(source_ip);
CREATE INDEX idx_attacks_timestamp ON attacks(request_timestamp);
CREATE INDEX idx_attacks_severity ON attacks(severity_level);
```

#### attack_patterns Table
```sql
CREATE TABLE attack_patterns (
    id SERIAL PRIMARY KEY,
    pattern_id UUID UNIQUE NOT NULL,
    pattern_hash VARCHAR(64) UNIQUE NOT NULL,
    pattern_name VARCHAR(255),
    pattern_description TEXT,
    pattern_type VARCHAR(50),
    pattern_category VARCHAR(100),
    
    -- Pattern Characteristics
    payload_template TEXT,
    characteristic_features JSONB,
    attack_indicators TEXT[],
    
    -- Statistics
    total_occurrences INTEGER DEFAULT 1,
    unique_sources INTEGER DEFAULT 1,
    success_rate FLOAT,
    average_confidence_score FLOAT,
    
    -- Temporal Information
    first_observed TIMESTAMP,
    last_observed TIMESTAMP,
    frequency_trend VARCHAR(20),
    
    -- Attribution
    attributed_group VARCHAR(100),
    attributed_campaign VARCHAR(100),
    threat_level VARCHAR(20),
    
    -- Relationships
    parent_pattern_id UUID,
    variant_patterns UUID[],
    related_patterns UUID[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patterns_hash ON attack_patterns(pattern_hash);
CREATE INDEX idx_patterns_type ON attack_patterns(pattern_type);
CREATE INDEX idx_patterns_observed ON attack_patterns(last_observed);
```

#### indicators_of_compromise Table
```sql
CREATE TABLE indicators_of_compromise (
    id SERIAL PRIMARY KEY,
    ioc_id UUID UNIQUE NOT NULL,
    indicator_type VARCHAR(50) NOT NULL,  -- IP, DOMAIN, HASH, SIGNATURE, etc.
    indicator_value TEXT NOT NULL,
    indicator_family VARCHAR(100),
    
    -- Classification
    severity VARCHAR(20),
    confidence_score FLOAT,
    threat_type VARCHAR(50),
    malware_family VARCHAR(100),
    
    -- Source Information
    source_organization VARCHAR(255),
    source_feed VARCHAR(100),
    feed_confidence FLOAT,
    
    -- Temporal Information
    created_at TIMESTAMP NOT NULL,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Context
    associated_campaigns TEXT[],
    associated_groups TEXT[],
    related_iocs UUID[],
    attack_ids UUID[],
    
    -- Metadata
    raw_data JSONB,
    tags TEXT[],
    notes TEXT
);

CREATE INDEX idx_iocs_type_value ON indicators_of_compromise(indicator_type, indicator_value);
CREATE INDEX idx_iocs_severity ON indicators_of_compromise(severity);
CREATE INDEX idx_iocs_created ON indicators_of_compromise(created_at);
```

#### threat_feeds Table
```sql
CREATE TABLE threat_feeds (
    id SERIAL PRIMARY KEY,
    feed_id UUID UNIQUE NOT NULL,
    feed_name VARCHAR(255) NOT NULL,
    feed_description TEXT,
    feed_url TEXT NOT NULL,
    feed_type VARCHAR(50),  -- IP_REPUTATION, MALWARE_HASH, etc.
    
    -- Feed Configuration
    authentication_required BOOLEAN,
    update_frequency VARCHAR(50),
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Statistics
    total_indicators INTEGER,
    last_update TIMESTAMP,
    next_scheduled_update TIMESTAMP,
    indicators_added_recent INT,
    indicators_removed_recent INT,
    
    -- Status
    feed_status VARCHAR(20),  -- ACTIVE, INACTIVE, FAILED
    last_error TEXT,
    reliability_score FLOAT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### attack_campaigns Table
```sql
CREATE TABLE attack_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_id UUID UNIQUE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_description TEXT,
    
    -- Timeline
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    ongoing BOOLEAN DEFAULT true,
    
    -- Attribution
    attributed_group VARCHAR(100),
    motivation VARCHAR(100),  -- Financial, Political, etc.
    target_industries TEXT[],
    target_geographies TEXT[],
    
    -- Statistics
    total_attacks INTEGER,
    unique_targets INTEGER,
    success_rate FLOAT,
    
    -- Attack Patterns Used
    attack_patterns UUID[],
    
    -- Intelligence
    campaign_notes TEXT,
    intelligence_level VARCHAR(20),
    related_campaigns UUID[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Pattern Analysis Engine

### Overview
The pattern analysis engine identifies relationships between attacks, clusters similar attacks, and discovers emerging trends and campaigns.

### Implementation

```python
from sklearn.cluster import DBSCAN
from scipy.spatial.distance import pdist, squareform
import hashlib
import numpy as np

class PatternAnalysisEngine:
    def __init__(self, db_connection):
        self.db = db_connection
        self.clustering_model = DBSCAN(eps=0.3, min_samples=5)
        self.similarity_threshold = 0.85
    
    def analyze_attacks(self, time_window_hours=24):
        """Analyze recent attacks for patterns"""
        
        # Fetch recent attacks
        attacks = self.db.query("""
            SELECT * FROM attacks 
            WHERE request_timestamp > NOW() - INTERVAL '%s hours'
            ORDER BY request_timestamp DESC
        """ % time_window_hours)
        
        if len(attacks) < 5:
            print("Insufficient attacks for pattern analysis")
            return []
        
        # Extract feature vectors for clustering
        feature_vectors = self._extract_pattern_features(attacks)
        
        # Perform clustering
        clusters = self.clustering_model.fit_predict(feature_vectors)
        
        # Analyze each cluster
        patterns = []
        for cluster_id in set(clusters):
            if cluster_id == -1:  # Skip noise points
                continue
            
            cluster_attacks = [attacks[i] for i, c in enumerate(clusters) if c == cluster_id]
            pattern_info = self._analyze_cluster(cluster_attacks)
            patterns.append(pattern_info)
            
            # Store pattern in database
            self._store_pattern(pattern_info)
        
        return patterns
    
    def _extract_pattern_features(self, attacks):
        """Extract features for pattern clustering"""
        features = []
        
        for attack in attacks:
            feature_vector = [
                len(attack['payload']),
                attack['payload'].count('UNION'),
                attack['payload'].count('SELECT'),
                attack['payload'].count('--'),
                attack['payload'].count('/*'),
                attack['payload'].count("'"),
                1.0 if 'admin' in attack['payload'].lower() else 0.0,
                1.0 if 'password' in attack['payload'].lower() else 0.0,
                len(set(attack['attack_vectors'])),
                len(attack['evasion_techniques']),
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def _analyze_cluster(self, cluster_attacks):
        """Analyze attack cluster for patterns"""
        
        return {
            'cluster_size': len(cluster_attacks),
            'cluster_id': hashlib.sha256(
                str(sorted([a['id'] for a in cluster_attacks])).encode()
            ).hexdigest(),
            'attack_type': self._determine_attack_type(cluster_attacks),
            'common_payloads': self._extract_common_payloads(cluster_attacks),
            'geographic_distribution': self._analyze_geography(cluster_attacks),
            'temporal_pattern': self._analyze_temporal_distribution(cluster_attacks),
            'tool_signatures': self._identify_tools(cluster_attacks),
            'attributed_group': self._attribute_group(cluster_attacks),
            'campaign_name': self._identify_campaign(cluster_attacks),
            'severity_assessment': self._assess_severity(cluster_attacks),
            'success_rate': self._calculate_success_rate(cluster_attacks),
            'evolution_indicators': self._analyze_evolution(cluster_attacks)
        }
    
    def _determine_attack_type(self, attacks):
        """Determine primary attack type in cluster"""
        type_counts = {}
        for attack in attacks:
            attack_type = attack['attack_type']
            type_counts[attack_type] = type_counts.get(attack_type, 0) + 1
        
        if type_counts:
            return max(type_counts.items(), key=lambda x: x[1])[0]
        return "Unknown"
    
    def _extract_common_payloads(self, attacks):
        """Identify common payload patterns"""
        payloads = [a['payload_normalized'] for a in attacks]
        payload_hashes = [hashlib.sha256(p.encode()).hexdigest() for p in payloads]
        
        # Find most common payloads
        from collections import Counter
        payload_freq = Counter(payload_hashes)
        
        common_payloads = []
        for payload_hash, frequency in payload_freq.most_common(5):
            common_payloads.append({
                'hash': payload_hash,
                'frequency': frequency,
                'percentage': frequency / len(attacks) * 100
            })
        
        return common_payloads
    
    def _analyze_geography(self, attacks):
        """Analyze geographic distribution of attacks"""
        countries = {}
        for attack in attacks:
            country = attack['source_country']
            countries[country] = countries.get(country, 0) + 1
        
        return {
            'countries': sorted(countries.items(), key=lambda x: x[1], reverse=True),
            'total_countries': len(countries),
            'primary_country': max(countries.items(), key=lambda x: x[1])[0] if countries else None
        }
    
    def _analyze_temporal_distribution(self, attacks):
        """Analyze temporal patterns in attacks"""
        from datetime import datetime
        
        timestamps = [a['request_timestamp'] for a in attacks]
        hours = [t.hour for t in timestamps]
        days = [t.strftime('%A') for t in timestamps]
        
        return {
            'time_span_hours': (max(timestamps) - min(timestamps)).total_seconds() / 3600,
            'peak_hours': self._find_peaks(hours),
            'peak_days': self._find_peaks(days),
            'attack_frequency_trend': self._calculate_frequency_trend(timestamps)
        }
    
    def _identify_tools(self, attacks):
        """Identify tools used in attacks"""
        tools = {}
        tool_keywords = {
            'sqlmap': ['sqlmap', 'sqlmapv'],
            'havij': ['havij'],
            'acunetix': ['acunetix'],
            'nessus': ['nessus'],
            'burp': ['burp', 'burpsuite']
        }
        
        for attack in attacks:
            user_agent = attack['user_agent'].lower()
            for tool, keywords in tool_keywords.items():
                if any(kw in user_agent for kw in keywords):
                    tools[tool] = tools.get(tool, 0) + 1
        
        return sorted(tools.items(), key=lambda x: x[1], reverse=True)
    
    def _attribute_group(self, attacks):
        """Attempt attribution to attacker groups"""
        # This would integrate with threat intelligence databases
        # For now, return basic statistics
        
        return {
            'suspected_groups': [],
            'confidence': 0.0,
            'reasoning': "Requires external threat intelligence integration"
        }
    
    def _identify_campaign(self, attacks):
        """Identify if attacks belong to a known campaign"""
        # Compare against known campaign patterns
        return {
            'campaign_name': None,
            'confidence': 0.0,
            'related_attacks': 0
        }
    
    def _assess_severity(self, attacks):
        """Assess overall severity of attack cluster"""
        successful_attacks = sum(1 for a in attacks if a['success'])
        data_exfiltrated = sum(1 for a in attacks if a['data_exfiltrated'])
        
        severity_score = (
            (successful_attacks / len(attacks) * 0.4) +
            (data_exfiltrated / len(attacks) * 0.4) +
            (len(attacks) / 1000 * 0.2)  # Volume factor
        )
        
        if severity_score > 0.7:
            severity = "CRITICAL"
        elif severity_score > 0.5:
            severity = "HIGH"
        elif severity_score > 0.3:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        
        return {
            'severity': severity,
            'score': severity_score,
            'successful_attacks': successful_attacks,
            'data_exfiltrated_attacks': data_exfiltrated
        }
    
    def _calculate_success_rate(self, attacks):
        """Calculate attack success rate"""
        successful = sum(1 for a in attacks if a['success'])
        return successful / len(attacks) if attacks else 0.0
    
    def _analyze_evolution(self, attacks):
        """Analyze attack technique evolution"""
        # Sort by timestamp
        sorted_attacks = sorted(attacks, key=lambda a: a['request_timestamp'])
        
        # Track changes in payloads, evasion techniques, etc.
        evolution = {
            'payload_variations': len(set(a['payload_normalized'] for a in attacks)),
            'evasion_techniques_used': set(),
            'attack_refinement': "Techniques becoming more sophisticated" if len(attacks) > 10 else "Early stage attacks"
        }
        
        for attack in attacks:
            evolution['evasion_techniques_used'].update(attack['evasion_techniques'])
        
        return evolution
    
    def _store_pattern(self, pattern_info):
        """Store identified pattern in database"""
        pattern_hash = hashlib.sha256(
            str(pattern_info).encode()
        ).hexdigest()
        
        self.db.execute("""
            INSERT INTO attack_patterns 
            (pattern_id, pattern_hash, pattern_name, pattern_type, pattern_description, 
             total_occurrences, success_rate, first_observed, last_observed, 
             attributed_group, threat_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(pattern_hash) DO UPDATE SET
            total_occurrences = total_occurrences + 1,
            last_observed = NOW()
        """, (
            str(uuid.uuid4()),
            pattern_hash,
            pattern_info['campaign_name']['campaign_name'] if pattern_info.get('campaign_name') else 'Unknown',
            pattern_info['attack_type'],
            f"Cluster of {pattern_info['cluster_size']} similar attacks",
            pattern_info['cluster_size'],
            pattern_info['success_rate'],
            datetime.now(),
            datetime.now(),
            str(pattern_info['attributed_group']),
            pattern_info['severity_assessment']['severity']
        ))
    
    def _find_peaks(self, values):
        """Find peak values in a list"""
        from collections import Counter
        counts = Counter(values)
        return counts.most_common(3)
    
    def _calculate_frequency_trend(self, timestamps):
        """Calculate if attack frequency is increasing or decreasing"""
        if len(timestamps) < 2:
            return "INSUFFICIENT_DATA"
        
        sorted_ts = sorted(timestamps)
        mid = len(sorted_ts) // 2
        first_half = len(sorted_ts[:mid])
        second_half = len(sorted_ts[mid:])
        
        if second_half > first_half * 1.5:
            return "INCREASING"
        elif first_half > second_half * 1.5:
            return "DECREASING"
        else:
            return "STABLE"
```

---

## IOC Generator

### Overview
Automatically extracts actionable Indicators of Compromise from detected attacks for distribution to security tools and threat intelligence platforms.

### Implementation

```python
import hashlib
import uuid
from datetime import datetime, timedelta

class IOCGenerator:
    def __init__(self, db_connection):
        self.db = db_connection
        self.ioc_types = {
            'IP': self._generate_ip_ioc,
            'DOMAIN': self._generate_domain_ioc,
            'HASH': self._generate_hash_ioc,
            'SIGNATURE': self._generate_signature_ioc,
            'USER_AGENT': self._generate_user_agent_ioc,
            'EMAIL': self._generate_email_ioc,
            'URL': self._generate_url_ioc,
            'PAYLOAD': self._generate_payload_ioc
        }
    
    def generate_iocs_from_attack(self, attack):
        """Generate IOCs from a single detected attack"""
        iocs = []
        
        # IP Address IOC (High Confidence)
        if attack['source_ip']:
            iocs.append(self._generate_ip_ioc(attack))
        
        # User Agent IOC (Medium Confidence)
        if attack['user_agent']:
            iocs.append(self._generate_user_agent_ioc(attack))
        
        # Payload Signature IOC (High Confidence)
        iocs.append(self._generate_signature_ioc(attack))
        
        # Attack Pattern Hash IOC
        iocs.append(self._generate_payload_ioc(attack))
        
        # Store IOCs
        for ioc in iocs:
            self._store_ioc(ioc)
        
        return iocs
    
    def _generate_ip_ioc(self, attack):
        """Generate IP address IOC"""
        return {
            'ioc_id': str(uuid.uuid4()),
            'indicator_type': 'IP',
            'indicator_value': str(attack['source_ip']),
            'indicator_family': 'SQL_INJECTION_ATTACKER',
            'severity': 'HIGH' if attack['success'] else 'MEDIUM',
            'confidence_score': 0.95 if attack['success'] else 0.75,
            'threat_type': 'SQL_INJECTION_ATTACK',
            'source_organization': 'Internal Detection',
            'created_at': datetime.now(),
            'first_seen': attack['request_timestamp'],
            'last_seen': attack['request_timestamp'],
            'expires_at': datetime.now() + timedelta(days=30),
            'associated_campaigns': [str(attack['campaign_id'])] if attack.get('campaign_id') else [],
            'related_iocs': [],
            'attack_ids': [attack['attack_id']],
            'raw_data': {
                'country': attack['source_country'],
                'asn': attack['source_asn'],
                'isp': attack['source_isp'],
                'attack_type': attack['attack_type']
            },
            'notes': f"Performed {attack['attack_type']} attack on {attack['target_application']}"
        }
    
    def _generate_user_agent_ioc(self, attack):
        """Generate User Agent IOC"""
        ua_hash = hashlib.sha256(attack['user_agent'].encode()).hexdigest()
        
        return {
            'ioc_id': str(uuid.uuid4()),
            'indicator_type': 'USER_AGENT_HASH',
            'indicator_value': ua_hash,
            'indicator_family': 'SUSPICIOUS_TOOL',
            'severity': 'MEDIUM',
            'confidence_score': 0.80,
            'threat_type': 'SQLINJECTION_TOOL_USAGE',
            'source_organization': 'Internal Detection',
            'created_at': datetime.now(),
            'related_iocs': [],
            'attack_ids': [attack['attack_id']],
            'raw_data': {
                'user_agent_raw': attack['user_agent']
            },
            'tags': ['suspicious_tool'],
            'notes': f"User Agent from {attack['source_ip']}: {attack['user_agent']}"
        }
    
    def _generate_signature_ioc(self, attack):
        """Generate Payload Signature IOC"""
        payload_hash = hashlib.sha256(attack['payload_normalized'].encode()).hexdigest()
        
        return {
            'ioc_id': str(uuid.uuid4()),
            'indicator_type': 'PAYLOAD_SIGNATURE',
            'indicator_value': payload_hash,
            'indicator_family': 'SQL_INJECTION_PAYLOAD',
            'severity': 'HIGH' if attack['success'] else 'MEDIUM',
            'confidence_score': 0.95,
            'threat_type': 'SQL_INJECTION_ATTACK',
            'source_organization': 'Internal Detection',
            'created_at': datetime.now(),
            'related_iocs': [],
            'attack_ids': [attack['attack_id']],
            'raw_data': {
                'payload_first_50_chars': attack['payload'][:50],
                'attack_type': attack['attack_type'],
                'evasion_techniques': attack['evasion_techniques']
            },
            'tags': [attack['attack_type'].lower()],
            'notes': f"Payload hash for {attack['attack_type']} attack"
        }
    
    def _generate_payload_ioc(self, attack):
        """Generate full payload IOC"""
        return {
            'ioc_id': str(uuid.uuid4()),
            'indicator_type': 'PAYLOAD_PATTERN',
            'indicator_value': attack['payload_normalized'][:200],
            'indicator_family': 'SQL_INJECTION_PATTERN',
            'severity': 'HIGH',
            'confidence_score': 0.90,
            'threat_type': 'SQL_INJECTION_ATTACK',
            'source_organization': 'Internal Detection',
            'created_at': datetime.now(),
            'attack_ids': [attack['attack_id']],
            'raw_data': {
                'full_payload': attack['payload'],
                'attack_type': attack['attack_type'],
                'target_parameter': attack['target_parameter']
            },
            'notes': f"Attack payload on {attack['target_parameter']}"
        }
    
    def _generate_domain_ioc(self, attack):
        """Generate Domain IOC (if applicable)"""
        # Extract domain from attack payload if applicable
        pass
    
    def _generate_hash_ioc(self, attack):
        """Generate Hash IOC"""
        pass
    
    def _generate_email_ioc(self, attack):
        """Generate Email IOC (if applicable)"""
        pass
    
    def _generate_url_ioc(self, attack):
        """Generate URL IOC"""
        pass
    
    def _store_ioc(self, ioc):
        """Store IOC in database"""
        self.db.execute("""
            INSERT INTO indicators_of_compromise
            (ioc_id, indicator_type, indicator_value, indicator_family,
             severity, confidence_score, threat_type, source_organization,
             created_at, first_seen, last_seen, expires_at,
             associated_campaigns, attack_ids, raw_data, tags, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            ioc['ioc_id'],
            ioc['indicator_type'],
            ioc['indicator_value'],
            ioc['indicator_family'],
            ioc['severity'],
            ioc['confidence_score'],
            ioc.get('threat_type'),
            ioc['source_organization'],
            ioc['created_at'],
            ioc.get('first_seen'),
            ioc.get('last_seen'),
            ioc.get('expires_at'),
            ioc.get('associated_campaigns'),
            ioc['attack_ids'],
            json.dumps(ioc.get('raw_data', {})),
            ioc.get('tags', []),
            ioc.get('notes')
        ))
    
    def get_iocs_for_export(self, time_hours=24, severity_threshold='MEDIUM'):
        """Get IOCs for export to SIEM/TI platforms"""
        severity_map = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3}
        threshold_value = severity_map.get(severity_threshold, 1)
        
        iocs = self.db.query("""
            SELECT * FROM indicators_of_compromise
            WHERE created_at > NOW() - INTERVAL '%s hours'
            AND severity IN (%s)
            ORDER BY created_at DESC
        """ % (time_hours, ",".join(f"'{sev}'" for sev, val in severity_map.items() if val >= threshold_value)))
        
        return iocs
    
    def export_to_csv(self, iocs, filename):
        """Export IOCs to CSV format"""
        import csv
        
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['ioc_id', 'indicator_type', 'indicator_value',
                                                   'severity', 'confidence_score', 'created_at'])
            writer.writeheader()
            for ioc in iocs:
                writer.writerow(ioc)
    
    def export_to_json(self, iocs, filename):
        """Export IOCs to JSON format"""
        import json
        
        with open(filename, 'w') as f:
            json.dump(iocs, f, indent=2, default=str)
```

---

## Threat Intelligence Integration

### External Feeds Integration

```python
import requests
from datetime import datetime, timedelta

class ThreatIntelligenceFeedManager:
    def __init__(self, db_connection):
        self.db = db_connection
        self.feeds = self._load_configured_feeds()
    
    def _load_configured_feeds(self):
        """Load configured threat feeds"""
        return self.db.query("SELECT * FROM threat_feeds WHERE feed_status = 'ACTIVE'")
    
    def update_all_feeds(self):
        """Update all configured threat feeds"""
        results = []
        
        for feed in self.feeds:
            try:
                result = self.update_feed(feed)
                results.append(result)
            except Exception as e:
                self._handle_feed_error(feed, str(e))
        
        return results
    
    def update_feed(self, feed):
        """Update a single threat feed"""
        try:
            response = requests.get(
                feed['feed_url'],
                timeout=feed['timeout_seconds'],
                headers=self._get_auth_headers(feed)
            )
            
            if response.status_code == 200:
                indicators = self._parse_feed_response(response.text, feed['feed_type'])
                self._store_feed_indicators(indicators, feed)
                
                return {
                    'feed_id': feed['feed_id'],
                    'status': 'SUCCESS',
                    'indicators_added': len(indicators),
                    'timestamp': datetime.now()
                }
            else:
                raise Exception(f"HTTP {response.status_code}")
        
        except Exception as e:
            return {
                'feed_id': feed['feed_id'],
                'status': 'FAILED',
                'error': str(e),
                'timestamp': datetime.now()
            }
    
    def _get_auth_headers(self, feed):
        """Get authentication headers for feed"""
        headers = {}
        if feed['authentication_required']:
            # Retrieve credentials securely
            pass
        return headers
    
    def _parse_feed_response(self, response_text, feed_type):
        """Parse feed response based on type"""
        indicators = []
        
        if feed_type == 'IP_REPUTATION':
            for line in response_text.strip().split('\n'):
                if line and not line.startswith('#'):
                    indicators.append({
                        'type': 'IP',
                        'value': line.strip()
                    })
        
        elif feed_type == 'MALWARE_HASH':
            for line in response_text.strip().split('\n'):
                if line and not line.startswith('#'):
                    indicators.append({
                        'type': 'HASH',
                        'value': line.strip()
                    })
        
        return indicators
    
    def _store_feed_indicators(self, indicators, feed):
        """Store indicators from external feed"""
        for indicator in indicators:
            self.db.execute("""
                INSERT INTO indicators_of_compromise
                (ioc_id, indicator_type, indicator_value, source_feed, 
                 confidence_score, created_at, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                str(uuid.uuid4()),
                indicator['type'],
                indicator['value'],
                feed['feed_name'],
                0.7,  # External feed confidence
                datetime.now(),
                datetime.now() + timedelta(days=7)
            ))
```

---

## Success Criteria

- ✓ Knowledge base storing 1M+ attacks
- ✓ Attack patterns identified for 80%+ of attacks
- ✓ IOC generation for 95%+ of detected attacks
- ✓ Real-time pattern analysis completing in <10 seconds
- ✓ External threat feed integration successful
- ✓ Geographic distribution and attribution working
- ✓ Campaign tracking and correlation functional
