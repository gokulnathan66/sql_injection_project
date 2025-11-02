"""
Train ML Model Script
Generates dataset and trains the Random Forest classifier
"""
import sys
import numpy as np
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from data_generator import SQLInjectionDataGenerator
from app.services.ml_detector import MLDetector

def main():
    print("="*60)
    print("SQL INJECTION DETECTION - MODEL TRAINING")
    print("="*60)
    print()
    
    # Step 1: Generate dataset
    print("Step 1: Generating synthetic dataset...")
    generator = SQLInjectionDataGenerator()
    df = generator.generate_dataset(num_samples=1000)
    X, y, feature_columns = generator.save_dataset(df, output_dir='data')
    print()
    
    # Step 2: Train model
    print("Step 2: Training Random Forest classifier...")
    detector = MLDetector()
    metrics = detector.train(X, y)
    print()
    
    # Step 3: Save model
    print("Step 3: Saving trained model...")
    model_path = 'app/models/rf_detector.pkl'
    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    detector.save_model(model_path)
    print()
    
    print("="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print(f"Model saved to: {model_path}")
    print(f"Dataset saved to: data/")
    print()
    print("Model Performance:")
    print(f"  Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"  Precision: {metrics['precision']*100:.2f}%")
    print(f"  Recall:    {metrics['recall']*100:.2f}%")
    print(f"  F1 Score:  {metrics['f1_score']*100:.2f}%")
    print()

if __name__ == "__main__":
    main()

