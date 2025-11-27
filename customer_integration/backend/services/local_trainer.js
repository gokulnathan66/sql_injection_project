/**
 * Local Training Manager
 * Handles local model training at organization endpoints
 * Simplified version for Random Forest model compatibility
 */

class LocalTrainer {
    constructor(orgId) {
        this.orgId = orgId;
        this.currentRound = 0;
        this.globalWeights = null;
        this.trainingHistory = [];
    }

    /**
     * Download global model weights
     * For Random Forest, we store model metadata
     */
    async loadGlobalModel(globalWeights) {
        this.globalWeights = globalWeights;
        console.log(`[${this.orgId}] Loaded global model weights`);
    }

    /**
     * Train model locally on organization's data
     * Returns gradients/updates for federated learning
     */
    async train(localData) {
        const { features, labels } = localData;

        if (!features || !labels || features.length === 0) {
            throw new Error('No training data provided');
        }

        console.log(`[${this.orgId}] Starting local training`);
        console.log(`  - Training samples: ${features.length}`);

        // For Random Forest compatibility, we compute feature importance as update
        // In a full neural network implementation, this would be gradients
        const update = this.computeModelUpdate(features, labels);

        // Calculate basic metrics
        const metrics = {
            samples_trained: features.length,
            feature_count: features[0]?.length || 0,
            positive_samples: labels.filter(l => l === 1).length,
            negative_samples: labels.filter(l => l === 0).length,
            timestamp: new Date().toISOString()
        };

        this.trainingHistory.push({
            round: this.currentRound,
            timestamp: new Date().toISOString(),
            metrics: metrics
        });

        console.log(`[${this.orgId}] Local training completed`);
        console.log(`  - Samples: ${metrics.samples_trained}`);
        console.log(`  - Positive: ${metrics.positive_samples}, Negative: ${metrics.negative_samples}`);

        return { update, metrics };
    }

    /**
     * Compute model weight updates
     * For Random Forest, we return feature importance as proxy
     * In a full implementation, this would be gradient computation
     */
    computeModelUpdate(features, labels) {
        // Simplified: Compute average feature values weighted by label
        // This serves as a proxy for feature importance
        const featureCount = features[0]?.length || 28; // 28 features default
        
        // Initialize update array
        const update = [];
        
        // For each feature, compute weighted average
        for (let i = 0; i < featureCount; i++) {
            let weightedSum = 0;
            let totalWeight = 0;
            
            for (let j = 0; j < features.length; j++) {
                const featureValue = features[j][i] || 0;
                const label = labels[j] || 0;
                // Weight by label (malicious samples contribute more)
                const weight = label === 1 ? 2.0 : 1.0;
                weightedSum += featureValue * weight;
                totalWeight += weight;
            }
            
            const avgValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
            // Normalize to small update values
            update.push(avgValue * 0.01);
        }

        // Return as nested array for compatibility with Python backend
        return [update];
    }

    /**
     * Get training history
     */
    getTrainingHistory() {
        return this.trainingHistory;
    }

    /**
     * Set current round
     */
    setRound(roundNumber) {
        this.currentRound = roundNumber;
    }

    /**
     * Get current round
     */
    getCurrentRound() {
        return this.currentRound;
    }
}

module.exports = LocalTrainer;

