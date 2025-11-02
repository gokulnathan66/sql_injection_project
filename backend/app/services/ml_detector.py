"""
ML-based SQL Injection Detector
Uses Random Forest classifier for detection
"""
import pickle
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Tuple, Dict

class MLDetector:
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path
        self.attack_type_keywords = {
            'union_based': ['union', 'select'],
            'error_based': ['extractvalue', 'updatexml', 'cast'],
            'boolean_blind': ['and', 'or', '='],
            'time_based': ['sleep', 'waitfor', 'benchmark'],
            'second_order': ['insert', 'update', 'drop', 'grant'],
            'nosql': ['||', '&&', 'match'],
        }
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """Train Random Forest classifier"""
        print("Training ML model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
        }
        
        print(f"Model trained successfully!")
        print(f"Accuracy: {metrics['accuracy']:.4f}")
        print(f"Precision: {metrics['precision']:.4f}")
        print(f"Recall: {metrics['recall']:.4f}")
        print(f"F1 Score: {metrics['f1_score']:.4f}")
        
        return metrics
    
    def predict(self, features: np.ndarray) -> Tuple[bool, float]:
        """
        Predict if query is malicious
        Returns: (is_malicious, confidence)
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Reshape if single sample
        if len(features.shape) == 1:
            features = features.reshape(1, -1)
        
        # Get prediction and probability
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        is_malicious = bool(prediction == 1)
        confidence = float(probabilities[1] if is_malicious else probabilities[0])
        
        return is_malicious, confidence
    
    def identify_attack_type(self, query: str) -> str:
        """Identify specific attack type based on keywords"""
        query_lower = query.lower()
        
        scores = {}
        for attack_type, keywords in self.attack_type_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                scores[attack_type] = score
        
        if not scores:
            return 'unknown'
        
        # Return attack type with highest score
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def save_model(self, path: str):
        """Save trained model to disk"""
        if self.model is None:
            raise ValueError("No model to save")
        
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
        
        print(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load trained model from disk"""
        with open(path, 'rb') as f:
            self.model = pickle.load(f)
        
        print(f"Model loaded from {path}")

