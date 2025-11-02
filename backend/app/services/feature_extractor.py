"""
Feature Extraction Service
Extracts security-relevant features from SQL queries
"""
from typing import Dict, List

class FeatureExtractor:
    def __init__(self):
        self.feature_names = [
            'length', 'union_count', 'select_count', 'insert_count', 
            'update_count', 'delete_count', 'drop_count', 'exec_count',
            'execute_count', 'concat_count', 'cast_count', 'char_count',
            'comment_dashes', 'comment_slash_star', 'single_quote', 
            'double_quote', 'semicolon', 'equals', 'or_keyword', 
            'and_keyword', 'sleep_count', 'benchmark_count', 'waitfor_count',
            'information_schema', 'version_func', 'database_func', 
            'user_func', 'has_hex'
        ]
    
    def extract(self, query: str) -> Dict[str, int]:
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
    
    def extract_as_array(self, query: str) -> List[float]:
        """Extract features as array for ML model"""
        features = self.extract(query)
        return [float(features[name]) for name in self.feature_names]
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names"""
        return self.feature_names

