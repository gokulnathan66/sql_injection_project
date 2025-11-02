"""
Synthetic SQL Injection Dataset Generator
Generates labeled attack and benign query samples for ML training
"""
import random
import numpy as np
import pandas as pd
from pathlib import Path

class SQLInjectionDataGenerator:
    def __init__(self):
        self.attack_templates = {
            'union_based': [
                "' UNION SELECT username, password FROM users--",
                "' UNION SELECT NULL, table_name FROM information_schema.tables--",
                "' UNION ALL SELECT 1,2,3,4,5--",
                "' UNION SELECT @@version, NULL--",
                "' UNION SELECT database(), user()--",
                "1' UNION SELECT column_name FROM information_schema.columns WHERE table_name='users'--",
                "' UNION SELECT CONCAT(username,':',password) FROM admin--",
                "' UNION SELECT load_file('/etc/passwd')--",
            ],
            'error_based': [
                "' AND EXTRACTVALUE(1, CONCAT(0x7e,(SELECT version()),0x7e))--",
                "' AND UPDATEXML(1,CONCAT(0x7e,(SELECT @@version),0x7e),1)--",
                "' AND 1=CAST((SELECT version()) AS INT)--",
                "' GROUP BY CONCAT(version(),FLOOR(RAND(0)*2)) HAVING MIN(0)--",
                "' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
                "' OR 1 GROUP BY CONCAT((SELECT version()),FLOOR(RAND()*2))--",
            ],
            'boolean_blind': [
                "' AND 1=1--",
                "' AND 1=2--",
                "' AND 'a'='a",
                "' AND (SELECT COUNT(*) FROM users)>0--",
                "' AND ASCII(SUBSTRING((SELECT password FROM users WHERE id=1),1,1))>64--",
                "' OR '1'='1",
                "' AND IF(1=1,TRUE,FALSE)--",
                "' AND (SELECT COUNT(*) FROM users WHERE username='admin')>0--",
                "' AND SUBSTRING(version(),1,1)='5'--",
            ],
            'time_based': [
                "'; WAITFOR DELAY '00:00:05'--",
                "' AND IF(1=1,SLEEP(5),0)--",
                "' OR IF((SELECT COUNT(*) FROM users)>0,SLEEP(3),0)--",
                "' AND (SELECT SLEEP(2) WHERE database()='dvwa')--",
                "' AND BENCHMARK(5000000,SHA1('test'))--",
                "' OR SLEEP(5)--",
                "'; SELECT SLEEP(3)--",
            ],
            'second_order': [
                "admin'; INSERT INTO users VALUES('hacker','password123');--",
                "admin'; UPDATE users SET role='admin' WHERE id=1;--",
                "admin'; DROP TABLE users;--",
                "admin'; GRANT ALL ON *.* TO 'hacker'@'%';--",
            ],
            'nosql': [
                "admin' || '1'=='1",
                "' || this.password.match(/.*/)//",
                "admin' && this.password.match(/.*/)//",
            ]
        }
        
        self.benign_queries = [
            "SELECT * FROM users WHERE id=1",
            "SELECT name, email FROM customers WHERE active=true",
            "UPDATE users SET last_login=NOW() WHERE id=10",
            "INSERT INTO orders (user_id, product_id, quantity) VALUES (1, 5, 2)",
            "DELETE FROM sessions WHERE expires_at < NOW()",
            "SELECT COUNT(*) FROM products WHERE category='electronics'",
            "SELECT u.name, o.total FROM users u JOIN orders o ON u.id=o.user_id",
            "SELECT * FROM posts WHERE published=true ORDER BY created_at DESC LIMIT 10",
            "UPDATE inventory SET quantity=quantity-1 WHERE product_id=5",
            "SELECT AVG(price) FROM products WHERE category='books'",
            "INSERT INTO logs (user_id, action, timestamp) VALUES (1, 'login', NOW())",
            "SELECT * FROM users WHERE email='user@example.com'",
            "DELETE FROM cart WHERE user_id=5 AND product_id=10",
            "SELECT p.name, c.name FROM products p JOIN categories c ON p.category_id=c.id",
            "UPDATE profiles SET bio='Software Engineer' WHERE user_id=1",
        ]
    
    def extract_features(self, query):
        """Extract features from SQL query"""
        query_lower = query.lower()
        
        features = {
            'length': len(query),
            'union_count': query_lower.count('union'),
            'select_count': query_lower.count('select'),
            'insert_count': query_lower.count('insert'),
            'update_count': query_lower.count('update'),
            'delete_count': query_lower.count('delete'),
            'drop_count': query_lower.count('drop'),
            'exec_count': query_lower.count('exec'),
            'execute_count': query_lower.count('execute'),
            'concat_count': query_lower.count('concat'),
            'cast_count': query_lower.count('cast'),
            'char_count': query_lower.count('char'),
            'comment_dashes': query.count('--'),
            'comment_slash_star': query.count('/*'),
            'single_quote': query.count("'"),
            'double_quote': query.count('"'),
            'semicolon': query.count(';'),
            'equals': query.count('='),
            'or_keyword': query_lower.count(' or '),
            'and_keyword': query_lower.count(' and '),
            'sleep_count': query_lower.count('sleep'),
            'benchmark_count': query_lower.count('benchmark'),
            'waitfor_count': query_lower.count('waitfor'),
            'information_schema': 1 if 'information_schema' in query_lower else 0,
            'version_func': 1 if 'version()' in query_lower or '@@version' in query_lower else 0,
            'database_func': 1 if 'database()' in query_lower else 0,
            'user_func': 1 if 'user()' in query_lower else 0,
            'has_hex': 1 if '0x' in query_lower else 0,
        }
        
        return features
    
    def generate_dataset(self, num_samples=1000):
        """Generate balanced dataset of attacks and benign queries"""
        data = []
        
        # Generate attack samples (60% of dataset)
        num_attacks = int(num_samples * 0.6)
        attacks_per_type = num_attacks // len(self.attack_templates)
        
        for attack_type, templates in self.attack_templates.items():
            for _ in range(attacks_per_type):
                # Select random template and add variations
                template = random.choice(templates)
                
                # Add random variations
                if random.random() > 0.5:
                    template = template.upper() if random.random() > 0.5 else template
                
                features = self.extract_features(template)
                features['query'] = template
                features['label'] = 1  # Malicious
                features['attack_type'] = attack_type
                
                data.append(features)
        
        # Generate benign samples (40% of dataset)
        num_benign = num_samples - len(data)
        
        for _ in range(num_benign):
            query = random.choice(self.benign_queries)
            
            # Add variations to benign queries
            if random.random() > 0.7:
                query = query.replace('1', str(random.randint(1, 100)))
            
            features = self.extract_features(query)
            features['query'] = query
            features['label'] = 0  # Benign
            features['attack_type'] = 'benign'
            
            data.append(features)
        
        # Shuffle dataset
        random.shuffle(data)
        
        return pd.DataFrame(data)
    
    def save_dataset(self, df, output_dir='data'):
        """Save dataset to files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Save full dataset as CSV
        df.to_csv(output_path / 'sqli_dataset.csv', index=False)
        
        # Save features and labels separately for ML
        feature_columns = [col for col in df.columns if col not in ['query', 'label', 'attack_type']]
        X = df[feature_columns].values
        y = df['label'].values
        
        np.save(output_path / 'features.npy', X)
        np.save(output_path / 'labels.npy', y)
        
        print(f"Dataset saved to {output_path}")
        print(f"Total samples: {len(df)}")
        print(f"Attack samples: {(df['label'] == 1).sum()}")
        print(f"Benign samples: {(df['label'] == 0).sum()}")
        print(f"Features: {len(feature_columns)}")
        
        return X, y, feature_columns

def main():
    """Generate and save dataset"""
    print("Generating SQL Injection Detection Dataset...")
    
    generator = SQLInjectionDataGenerator()
    df = generator.generate_dataset(num_samples=1000)
    
    X, y, feature_columns = generator.save_dataset(df, output_dir='backend/data')
    
    print("\nFeature columns:")
    for i, col in enumerate(feature_columns, 1):
        print(f"  {i}. {col}")
    
    print("\nDataset generation complete!")

if __name__ == "__main__":
    main()

