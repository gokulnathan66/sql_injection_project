"""
Query Normalization Service
Standardizes SQL queries by removing obfuscation techniques
"""
import re
from urllib.parse import unquote

class QueryNormalizer:
    def __init__(self):
        self.comment_patterns = [
            (r'--.*$', ''),  # Single line comments
            (r'/\*.*?\*/', ''),  # Multi-line comments
            (r'#.*$', ''),  # MySQL comments
        ]
    
    def normalize(self, query: str) -> str:
        """
        Normalize SQL query by:
        1. URL decoding
        2. Removing comments
        3. Normalizing whitespace
        4. Converting to lowercase
        """
        # URL decode (handle multiple encoding)
        normalized = query
        for _ in range(3):  # Handle triple encoding
            decoded = unquote(normalized)
            if decoded == normalized:
                break
            normalized = decoded
        
        # Remove comments
        for pattern, replacement in self.comment_patterns:
            normalized = re.sub(pattern, replacement, normalized, flags=re.MULTILINE | re.DOTALL)
        
        # Normalize whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Strip leading/trailing whitespace
        normalized = normalized.strip()
        
        # Convert to lowercase for consistency
        normalized = normalized.lower()
        
        return normalized
    
    def remove_obfuscation(self, query: str) -> str:
        """Remove common obfuscation techniques"""
        # Remove null bytes
        query = query.replace('\x00', '')
        
        # Remove excessive whitespace variations
        query = re.sub(r'[\t\n\r\f\v]+', ' ', query)
        
        return query

