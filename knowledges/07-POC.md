To create an initial fully local Proof of Concept (POC) of the Secure Multi-Layered SQL Injection Mitigation Framework within 30 minutes using a lightweight stack and leveraging a cursor agent, follow this focused step-by-step plan:

***

## POC Objective
Build a minimal workable system that demonstrates real-time SQL injection attack detection on locally simulated traffic, with simplified components for data collection, detection, and visualization in under 30 minutes.

***

## Step 1: Prepare Local Environment

- Ensure Python 3.8+ installed with pip.
- Setup virtual environment to isolate dependencies:
  ```bash
  python3 -m venv poc-env
  source poc-env/bin/activate
  ```
- Install minimal required Python packages:
  ```bash
  pip install scikit-learn tensorflow numpy flask
  ```
- Install SQLMap (optional, for synthetic attack generation).

***

## Step 2: Simulate SQL Injection Traffic

Create a Python script (`simulate_attack.py`) to simulate SQL injection attack and benign queries on local Flask HTTP endpoint:

```python
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/query', methods=['POST'])
def query():
    sql_query = request.json.get('query')
    # Simple vuln simulation: if union keyword found, mark suspicious
    if 'union' in sql_query.lower():
        return jsonify({'status': 'error', 'message': 'SQL injection detected'}), 400
    return jsonify({'status': 'ok', 'message': 'Query executed'}), 200

if __name__ == "__main__":
    app.run(port=5000)
```

Run this local server to accept simulated SQL queries.

***

## Step 3: Basic Query Normalization

Implement minimal query normalization in Python for run-time queries:

```python
import re
from urllib.parse import unquote

def normalize_query(query):
    # URL decode
    q = unquote(query)
    # Remove comments
    q = re.sub(r'--.*', '', q)
    q = re.sub(r'/\\*.*?\\*/', '', q, flags=re.DOTALL)
    # Lowercase for simplicity
    return q.lower().strip()
```

***

## Step 4: Simple Feature Extraction

Extract simple features synchronous for classification:

```python
def extract_features(query):
    features = {}
    features['length'] = len(query)
    features['union_count'] = query.count('union')
    features['select_count'] = query.count('select')
    features['drop_count'] = query.count('drop')
    features['comment_present'] = 1 if '--' in query or '/*' in query else 0
    return list(features.values())
```

***

## Step 5: Train a Basic ML Model

Create a simple training dataset locally with synthetic attack and benign queries and train Random Forest:

```python
from sklearn.ensemble import RandomForestClassifier

X = [extract_features(q) for q in [
    "select * from users where id=1",
    "' union select password from users--",
    "update users set pass='12345' where id=10",
    "drop table users",
    "select name, email from customers",
    "'; drop database; --"
]]
y = [0, 1, 0, 1, 0, 1]  # 0=benign, 1=attack

model = RandomForestClassifier()
model.fit(X, y)
```

***

## Step 6: Real-Time Detection Service

Create a detection service that exposes an API to receive queries and detect SQL injection using the trained model:

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/detect', methods=['POST'])
def detect():
    query = request.json.get('query')
    normalized = normalize_query(query)
    features = extract_features(normalized)
    prediction = model.predict([features])[0]
    label = 'MALICIOUS' if prediction == 1 else 'BENIGN'
    return jsonify({'query': query, 'normalized': normalized, 'label': label})

if __name__ == "__main__":
    app.run(port=6000)
```

Run this service locally.

***

## Step 7: Quick Visualization (Optional)

Use command line or lightweight web dashboard (Flask with basic HTML/JS) to monitor detections.

***

## Step 8: Using Cursor Agent

Use your cursor agent to:
- Quickly generate training queries for model.
- Run multi-step commands and scripts above.
- Automate local server launches and POST queries.
- Build your dataset and perform evaluation in real-time.

***

## Summary for 30-Min POC

| Task                     | Tool                        | Time Estimate  |
|--------------------------|-----------------------------|----------------|
| Setup environment        | Python virtualenv + pip     | 5 min          |
| Simulate query endpoint  | Flask                      | 5 min          |
| Implement normalization  | Python string functions     | 3 min          |
| Feature extraction       | Python dict + list          | 3 min          |
| Train simple model       | scikit-learn RandomForest   | 5 min          |
| Build detection service  | Flask with model inference  | 5 min          |
| Run and test locally     | Postman/curl + Cursor agent | 5 min          |

This approach delivers a fully functional local proof of concept demonstrating SQL injection detection in real time using minimal but representative components, perfectly matching your time and local environment constraints.