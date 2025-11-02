"""
Test script for POC
Sends various queries to test the detection system
"""
import requests
import time
from colorama import init, Fore, Style

init(autoreset=True)

API_URL = "http://localhost:8000/api"

TEST_QUERIES = {
    "benign": [
        "SELECT * FROM users WHERE id = 1",
        "SELECT name, email FROM customers WHERE active = true",
        "UPDATE users SET last_login = NOW() WHERE id = 10",
        "INSERT INTO orders (user_id, product_id) VALUES (1, 5)",
    ],
    "malicious": [
        "' UNION SELECT username, password FROM users--",
        "' AND 1=1--",
        "'; DROP TABLE users--",
        "' OR '1'='1",
        "' AND SLEEP(5)--",
        "' AND EXTRACTVALUE(1, CONCAT(0x7e,(SELECT version()),0x7e))--",
    ]
}

def test_detection(query, expected_malicious):
    """Test a single query"""
    try:
        response = requests.post(
            f"{API_URL}/detect",
            json={"query": query},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            is_malicious = result['is_malicious']
            confidence = result['confidence']
            attack_type = result.get('attack_type', 'N/A')
            response_time = result['response_time_ms']
            
            # Check if prediction matches expectation
            correct = is_malicious == expected_malicious
            
            if correct:
                print(f"{Fore.GREEN}✓ CORRECT{Style.RESET_ALL}", end=" ")
            else:
                print(f"{Fore.RED}✗ WRONG{Style.RESET_ALL}", end=" ")
            
            status = f"{Fore.RED}MALICIOUS{Style.RESET_ALL}" if is_malicious else f"{Fore.GREEN}BENIGN{Style.RESET_ALL}"
            print(f"[{status}] Confidence: {confidence*100:.1f}% | Time: {response_time:.2f}ms")
            
            if is_malicious:
                print(f"  Attack Type: {attack_type}")
            
            print(f"  Query: {query[:80]}{'...' if len(query) > 80 else ''}")
            print()
            
            return correct
        else:
            print(f"{Fore.RED}Error: {response.status_code}{Style.RESET_ALL}")
            return False
            
    except Exception as e:
        print(f"{Fore.RED}Exception: {e}{Style.RESET_ALL}")
        return False

def main():
    print("="*80)
    print(f"{Fore.CYAN}SQL INJECTION DETECTION - POC TEST{Style.RESET_ALL}")
    print("="*80)
    print()
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_URL.replace('/api', '')}/health", timeout=5)
        if response.status_code != 200:
            print(f"{Fore.RED}Backend is not running! Start it with: python backend/main.py{Style.RESET_ALL}")
            return
    except:
        print(f"{Fore.RED}Cannot connect to backend! Make sure it's running on http://localhost:8000{Style.RESET_ALL}")
        return
    
    print(f"{Fore.GREEN}✓ Backend is running{Style.RESET_ALL}")
    print()
    
    total_tests = 0
    correct_tests = 0
    
    # Test benign queries
    print(f"{Fore.CYAN}Testing Benign Queries:{Style.RESET_ALL}")
    print("-"*80)
    for query in TEST_QUERIES["benign"]:
        if test_detection(query, expected_malicious=False):
            correct_tests += 1
        total_tests += 1
        time.sleep(0.5)
    
    # Test malicious queries
    print(f"{Fore.CYAN}Testing Malicious Queries:{Style.RESET_ALL}")
    print("-"*80)
    for query in TEST_QUERIES["malicious"]:
        if test_detection(query, expected_malicious=True):
            correct_tests += 1
        total_tests += 1
        time.sleep(0.5)
    
    # Summary
    print("="*80)
    accuracy = (correct_tests / total_tests) * 100
    print(f"{Fore.CYAN}Test Summary:{Style.RESET_ALL}")
    print(f"Total Tests: {total_tests}")
    print(f"Correct: {correct_tests}")
    print(f"Accuracy: {accuracy:.1f}%")
    print("="*80)
    
    if accuracy >= 90:
        print(f"{Fore.GREEN}✓ POC is working excellently!{Style.RESET_ALL}")
    elif accuracy >= 70:
        print(f"{Fore.YELLOW}⚠ POC is working but could be improved{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}✗ POC needs attention{Style.RESET_ALL}")

if __name__ == "__main__":
    main()

