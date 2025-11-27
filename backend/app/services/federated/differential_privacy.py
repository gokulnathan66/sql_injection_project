"""
Differential Privacy Engine
Applies privacy-preserving noise to gradients
"""
import numpy as np
from typing import List

class DifferentialPrivacyEngine:
    def __init__(self, epsilon: float = 0.5, delta: float = 1e-6, global_sensitivity: float = 1.0):
        """
        Initialize differential privacy parameters
        
        Args:
            epsilon: Privacy budget (smaller = stronger privacy)
            delta: Failure probability
            global_sensitivity: Maximum change from removing one record
        """
        self.epsilon = epsilon
        self.delta = delta
        self.global_sensitivity = global_sensitivity
        self.privacy_budget_used = 0.0
    
    def clip_gradients(self, gradients: List[np.ndarray], clipping_threshold: float = 1.0) -> List[np.ndarray]:
        """Clip gradients to bounded norm"""
        clipped = []
        for gradient in gradients:
            gradient_norm = np.linalg.norm(gradient)
            
            if gradient_norm > clipping_threshold:
                # Clip to threshold
                clipped_gradient = gradient * (clipping_threshold / gradient_norm)
            else:
                clipped_gradient = gradient.copy()
            
            clipped.append(clipped_gradient)
        
        return clipped
    
    def add_gaussian_noise(self, gradients: List[np.ndarray], sensitivity: float = None) -> List[np.ndarray]:
        """Add Gaussian noise for differential privacy"""
        if sensitivity is None:
            sensitivity = self.global_sensitivity
        
        # Calculate noise scale
        noise_scale = sensitivity / self.epsilon
        
        noisy_gradients = []
        for gradient in gradients:
            noise = np.random.normal(0, noise_scale, gradient.shape)
            noisy_gradient = gradient + noise
            noisy_gradients.append(noisy_gradient)
        
        # Update privacy budget
        self.privacy_budget_used += 1.0
        
        return noisy_gradients
    
    def add_laplacian_noise(self, gradients: List[np.ndarray], sensitivity: float = None) -> List[np.ndarray]:
        """Add Laplacian noise for local differential privacy"""
        if sensitivity is None:
            sensitivity = self.global_sensitivity
        
        noise_scale = sensitivity / self.epsilon
        
        noisy_gradients = []
        for gradient in gradients:
            noise = np.random.laplace(0, noise_scale, gradient.shape)
            noisy_gradient = gradient + noise
            noisy_gradients.append(noisy_gradient)
        
        self.privacy_budget_used += 1.0
        
        return noisy_gradients
    
    def apply_differential_privacy(self, gradients: List[np.ndarray], method: str = 'laplacian') -> List[np.ndarray]:
        """Full DP pipeline: clip then add noise"""
        # Step 1: Clip gradients
        clipped = self.clip_gradients(gradients, clipping_threshold=1.0)
        
        # Step 2: Add noise
        if method == 'gaussian':
            noisy = self.add_gaussian_noise(clipped)
        elif method == 'laplacian':
            noisy = self.add_laplacian_noise(clipped)
        else:
            raise ValueError(f"Unknown noise method: {method}")
        
        return noisy
    
    def get_privacy_guarantee(self) -> dict:
        """Get current privacy guarantee"""
        accumulated_epsilon = self.epsilon * self.privacy_budget_used
        
        return {
            'epsilon': accumulated_epsilon,
            'delta': self.delta,
            'privacy_budget_used': self.privacy_budget_used,
            'privacy_remaining': max(0, 1.0 - accumulated_epsilon)
        }


