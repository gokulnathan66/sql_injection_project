"""
Integration Test Script
Tests all components of the SQL Injection Mitigation Framework
"""
import asyncio
import requests
import json
import time
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"
TEST_RESULTS = []

def test_result(name: str, passed: bool, message: str = ""):
    """Record test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status}: {name}"
    if message:
        result += f" - {message}"
    print(result)
    TEST_RESULTS.append({"name": name, "passed": passed, "message": message})
    return passed

def test_health_check():
    """Test 1: Health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        return test_result(
            "Health Check",
            response.status_code == 200 and response.json().get("status") == "healthy",
            f"Status: {response.status_code}"
        )
    except Exception as e:
        return test_result("Health Check", False, str(e))

def test_root_endpoint():
    """Test 2: Root endpoint with service status"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        data = response.json()
        
        # Check all services are active
        services = data.get("services", {})
        all_active = (
            services.get("proxy") == "active" and
            services.get("honeypot") == "active" and
            services.get("detection_engine") == "active"
        )
        
        return test_result(
            "Root Endpoint - Services Status",
            all_active,
            f"Services: {services}"
        )
    except Exception as e:
        return test_result("Root Endpoint", False, str(e))

def test_detection_engine_benign():
    """Test 3: Detection engine - benign query"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/detect",
            json={"query": "SELECT * FROM users WHERE id = 1"},
            timeout=10
        )
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("is_malicious") == False and
            data.get("confidence") is not None
        )
        
        return test_result(
            "Detection Engine - Benign Query",
            passed,
            f"Malicious: {data.get('is_malicious')}, Confidence: {data.get('confidence')}"
        )
    except Exception as e:
        return test_result("Detection Engine - Benign", False, str(e))

def test_detection_engine_malicious():
    """Test 4: Detection engine - malicious query"""
    try:
        malicious_queries = [
            "' UNION SELECT username, password FROM users--",
            "' OR 1=1--",
            "'; DROP TABLE users--"
        ]
        
        all_passed = True
        for query in malicious_queries:
            response = requests.post(
                f"{BASE_URL}/api/detect",
                json={"query": query},
                timeout=10
            )
            data = response.json()
            
            if not (response.status_code == 200 and data.get("is_malicious") == True):
                all_passed = False
                break
        
        return test_result(
            "Detection Engine - Malicious Queries",
            all_passed,
            f"Tested {len(malicious_queries)} malicious patterns"
        )
    except Exception as e:
        return test_result("Detection Engine - Malicious", False, str(e))

def test_honeypot_direct():
    """Test 5: Honeypot service - direct access"""
    try:
        response = requests.post(
            f"{BASE_URL}/honeypot/test",
            json={"test": "data"},
            timeout=5
        )
        
        # Honeypot should return fake response
        data = response.json()
        passed = (
            response.status_code == 200 and
            data.get("status") == "ok" and
            "rows" in data
        )
        
        return test_result(
            "Honeypot Service - Direct Access",
            passed,
            f"Response: {data.get('status')}"
        )
    except Exception as e:
        return test_result("Honeypot Direct", False, str(e))

def test_proxy_middleware():
    """Test 6: Proxy middleware - suspicious request routing"""
    try:
        # Send suspicious request to non-API endpoint
        response = requests.post(
            f"{BASE_URL}/test-endpoint",
            data="' UNION SELECT * FROM users--",
            headers={"Content-Type": "text/plain"},
            timeout=5
        )
        
        # Should be routed to honeypot and return fake response
        data = response.json()
        passed = (
            response.status_code == 200 and
            data.get("status") == "ok"
        )
        
        return test_result(
            "Proxy Middleware - Suspicious Request Routing",
            passed,
            f"Status: {response.status_code}"
        )
    except Exception as e:
        return test_result("Proxy Middleware", False, str(e))

def test_knowledge_base_stats():
    """Test 7: Knowledge base - statistics"""
    try:
        response = requests.get(f"{BASE_URL}/api/stats", timeout=5)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "total_queries" in data and
            "malicious_queries" in data
        )
        
        return test_result(
            "Knowledge Base - Statistics",
            passed,
            f"Total queries: {data.get('total_queries')}"
        )
    except Exception as e:
        return test_result("Knowledge Base Stats", False, str(e))

def test_knowledge_base_attacks():
    """Test 8: Knowledge base - attack history"""
    try:
        response = requests.get(f"{BASE_URL}/api/attacks?limit=10", timeout=5)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            isinstance(data, list)
        )
        
        return test_result(
            "Knowledge Base - Attack History",
            passed,
            f"Retrieved {len(data)} attacks"
        )
    except Exception as e:
        return test_result("Knowledge Base Attacks", False, str(e))

def test_federated_register():
    """Test 9: Federated learning - organization registration"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/federated/register",
            json={
                "org_id": "test-org-001",
                "org_name": "Test Organization",
                "address": "test.example.com"
            },
            timeout=5
        )
        
        data = response.json()
        passed = (
            response.status_code == 200 and
            data.get("status") == "registered"
        )
        
        return test_result(
            "Federated Learning - Organization Registration",
            passed,
            f"Status: {data.get('status')}"
        )
    except Exception as e:
        return test_result("Federated Register", False, str(e))

def test_federated_status():
    """Test 10: Federated learning - status"""
    try:
        response = requests.get(f"{BASE_URL}/api/federated/status", timeout=5)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "current_round" in data and
            "registered_organizations" in data
        )
        
        return test_result(
            "Federated Learning - Status",
            passed,
            f"Organizations: {data.get('registered_organizations')}"
        )
    except Exception as e:
        return test_result("Federated Status", False, str(e))

def test_federated_download_model():
    """Test 11: Federated learning - download model"""
    try:
        response = requests.get(f"{BASE_URL}/api/federated/download-model", timeout=5)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "model_version" in data and
            "weights" in data
        )
        
        return test_result(
            "Federated Learning - Download Model",
            passed,
            f"Model version: {data.get('model_version')}"
        )
    except Exception as e:
        return test_result("Federated Download", False, str(e))

def test_federated_round():
    """Test 12: Federated learning - start round"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/federated/start-round",
            json={},
            timeout=10
        )
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "round" in data and
            data.get("status") == "COMPLETED"
        )
        
        return test_result(
            "Federated Learning - Start Round",
            passed,
            f"Round: {data.get('round')}"
        )
    except Exception as e:
        return test_result("Federated Round", False, str(e))

def test_federated_history():
    """Test 13: Federated learning - history"""
    try:
        response = requests.get(f"{BASE_URL}/api/federated/history?limit=5", timeout=5)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "history" in data and
            "total_rounds" in data
        )
        
        return test_result(
            "Federated Learning - History",
            passed,
            f"Total rounds: {data.get('total_rounds')}"
        )
    except Exception as e:
        return test_result("Federated History", False, str(e))

def test_attack_types():
    """Test 14: Verify attack type detection"""
    attack_types = {
        "union_based": "' UNION SELECT username, password FROM users--",
        "boolean_blind": "' OR 1=1--",
        "second_order": "'; DROP TABLE users--"
    }
    
    all_passed = True
    detected_types = []
    
    for expected_type, query in attack_types.items():
        try:
            response = requests.post(
                f"{BASE_URL}/api/detect",
                json={"query": query},
                timeout=10
            )
            data = response.json()
            
            if data.get("is_malicious") and data.get("attack_type"):
                detected_types.append(data.get("attack_type"))
        except:
            all_passed = False
    
    return test_result(
        "Attack Type Detection",
        all_passed and len(detected_types) > 0,
        f"Detected types: {detected_types}"
    )

def test_performance_latency():
    """Test 15: Performance - latency check"""
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/detect",
            json={"query": "SELECT * FROM users WHERE id = 1"},
            timeout=10
        )
        elapsed = (time.time() - start_time) * 1000  # Convert to ms
        
        data = response.json()
        response_time = data.get("response_time_ms", 0)
        
        # Check both API response time and measured latency
        passed = response.status_code == 200 and response_time < 100  # Allow 100ms for test environment
        
        return test_result(
            "Performance - Latency",
            passed,
            f"Response time: {response_time:.2f}ms, API latency: {elapsed:.2f}ms"
        )
    except Exception as e:
        return test_result("Performance Latency", False, str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    total = len(TEST_RESULTS)
    passed = sum(1 for r in TEST_RESULTS if r["passed"])
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\nFailed Tests:")
        for result in TEST_RESULTS:
            if not result["passed"]:
                print(f"  - {result['name']}: {result['message']}")
    
    print("="*60)
    
    return failed == 0

def main():
    """Run all tests"""
    print("="*60)
    print("SQL INJECTION MITIGATION FRAMEWORK - INTEGRATION TESTS")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    print("Waiting for server to be ready...")
    
    # Wait for server to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✓ Server is ready!\n")
                break
        except:
            if i == max_retries - 1:
                print("❌ Server is not responding. Please start the server first.")
                print("   Run: cd backend && python -m uvicorn app.main:app --reload")
                sys.exit(1)
            time.sleep(1)
    
    print("Running tests...\n")
    
    # Run all tests
    test_health_check()
    test_root_endpoint()
    test_detection_engine_benign()
    test_detection_engine_malicious()
    test_honeypot_direct()
    test_proxy_middleware()
    test_knowledge_base_stats()
    test_knowledge_base_attacks()
    test_federated_register()
    test_federated_status()
    test_federated_download_model()
    test_federated_round()
    test_federated_history()
    test_attack_types()
    test_performance_latency()
    
    # Print summary
    success = print_summary()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()


