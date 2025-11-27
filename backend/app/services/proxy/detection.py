"""
Proxy Detection Module
Detects suspicious SQL patterns in requests
"""
import re
import sqlparse

# Clean, balanced regex pattern
SQL_LIKE_RE = re.compile(
    r"(?i)("
    r"(select|union|insert|update|delete|drop|create|information_schema|load_file|benchmark|sleep)\b|"
    r"(or\s+1\s*=\s*1\b)|(or\s+'.+'\s*=\s*'.+'\b)|"  # OR 1=1 and OR 'a'='a'
    r"(--|#|/\*.*\*/)|"                              # comments
    r"(;)|"                                          # stacked queries
    r"(0x[0-9a-f]+)"                                 # hex payloads
    r")"
)

def extract_sql_like(text: str) -> str:
    """Extract SQL-like patterns from text"""
    if not text:
        return ""
    m = re.search(
        r"(?is)(select|union|insert|update|delete|or\s+1=1|or\s+'.+'\s*=\s*'.+').*",
        text,
    )
    return m.group(0) if m else ""

def is_suspicious(sql_fragment: str) -> bool:
    """Check if SQL fragment is suspicious"""
    if not sql_fragment:
        return False
    # Regex match first
    if SQL_LIKE_RE.search(sql_fragment):
        return True
    # Parse and check for stacked statements or comments
    try:
        parsed = sqlparse.parse(sql_fragment)
        if len(parsed) > 1:
            return True
        tokstr = "".join([t.value for t in parsed[0].tokens])
        if ";" in tokstr or "--" in tokstr or "/*" in tokstr:
            return True
    except Exception:
        return False
    return False


