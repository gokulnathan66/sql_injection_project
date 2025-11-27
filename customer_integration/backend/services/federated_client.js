/**
 * Federated Learning Client
 * Organization-side client for federated learning
 * Handles registration, model download, training, and update upload
 */

const axios = require('axios');
const LocalTrainer = require('./local_trainer');
const FeatureExtractor = require('./feature_extractor');

class FederatedClient {
    constructor(orgId, orgName, coordinatorUrl, apiKey = null) {
        this.orgId = orgId;
        this.orgName = orgName;
        this.coordinatorUrl = coordinatorUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = apiKey;
        this.localTrainer = new LocalTrainer(orgId);
        this.featureExtractor = new FeatureExtractor();
        this.currentRound = 0;
        this.isRegistered = false;
    }

    /**
     * Register this organization with the coordinator
     */
    async register() {
        try {
            const response = await axios.post(
                `${this.coordinatorUrl}/api/federated/register`,
                {
                    org_id: this.orgId,
                    org_name: this.orgName,
                    address: process.env.ORG_ADDRESS || 'localhost:5000'
                },
                {
                    headers: this.getAuthHeaders(),
                    timeout: 10000
                }
            );

            if (response.status === 200) {
                this.isRegistered = true;
                console.log(`[${this.orgId}] ✓ Successfully registered with coordinator`);
                return true;
            } else {
                console.error(`[${this.orgId}] Registration failed: HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error(`[${this.orgId}] Registration error:`, error.message);
            if (error.response) {
                console.error(`  Response: ${JSON.stringify(error.response.data)}`);
            }
            return false;
        }
    }

    /**
     * Download current global model from coordinator
     */
    async downloadGlobalModel() {
        try {
            const response = await axios.get(
                `${this.coordinatorUrl}/api/federated/download-model`,
                {
                    headers: this.getAuthHeaders(),
                    timeout: 30000
                }
            );

            if (response.status === 200 && response.data) {
                await this.localTrainer.loadGlobalModel(response.data.weights || {});
                this.currentRound = response.data.round || 0;
                this.localTrainer.setRound(this.currentRound);
                console.log(`[${this.orgId}] ✓ Downloaded global model (round ${this.currentRound})`);
                return true;
            } else {
                console.error(`[${this.orgId}] Model download failed: HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error(`[${this.orgId}] Model download error:`, error.message);
            if (error.response) {
                console.error(`  Response: ${JSON.stringify(error.response.data)}`);
            }
            return false;
        }
    }

    /**
     * Train locally and upload encrypted update to coordinator
     */
    async trainAndUpload(localDb) {
        try {
            console.log(`[${this.orgId}] Starting training and upload process`);

            // 1. Get local training data
            const attacks = await localDb.getUnprocessedAttacks(1000);
            
            if (attacks.length < 10) {
                console.log(`[${this.orgId}] Insufficient data for training (${attacks.length} samples)`);
                return false;
            }

            console.log(`[${this.orgId}] Processing ${attacks.length} attack samples`);

            // 2. Extract features
            const features = [];
            const labels = [];
            const attackIds = [];

            for (const attack of attacks) {
                const normalized = attack.normalized_query || attack.query;
                const featureVector = this.featureExtractor.extractAsArray(normalized);
                features.push(featureVector);
                labels.push(attack.is_malicious ? 1 : 0);
                attackIds.push(attack.id);
            }

            // 3. Train locally
            const { update, metrics } = await this.localTrainer.train({
                features,
                labels
            });

            // 4. Apply differential privacy
            const privateUpdate = this.applyDifferentialPrivacy(update);

            // 5. Upload to coordinator
            const uploadResponse = await axios.post(
                `${this.coordinatorUrl}/api/federated/upload-update`,
                {
                    org_id: this.orgId,
                    round: this.currentRound,
                    update: privateUpdate,
                    metrics: metrics
                },
                {
                    headers: this.getAuthHeaders(),
                    timeout: 60000
                }
            );

            if (uploadResponse.status === 200) {
                // Mark attacks as processed
                await localDb.markAsProcessed(attackIds);
                
                // Log training session
                await localDb.logTrainingSession(
                    this.currentRound,
                    attacks.length,
                    metrics,
                    'completed'
                );

                console.log(`[${this.orgId}] ✓ Successfully uploaded update (round ${this.currentRound})`);
                return true;
            } else {
                console.error(`[${this.orgId}] Upload failed: HTTP ${uploadResponse.status}`);
                return false;
            }
        } catch (error) {
            console.error(`[${this.orgId}] Training/upload error:`, error.message);
            if (error.response) {
                console.error(`  Response: ${JSON.stringify(error.response.data)}`);
            }
            return false;
        }
    }

    /**
     * Apply differential privacy to gradients
     * Adds Laplacian noise for privacy protection
     */
    applyDifferentialPrivacy(update) {
        const epsilon = parseFloat(process.env.DP_EPSILON || '0.5');
        const sensitivity = parseFloat(process.env.DP_SENSITIVITY || '1.0');
        const scale = sensitivity / epsilon;

        console.log(`[${this.orgId}] Applying differential privacy (ε=${epsilon}, scale=${scale.toFixed(4)})`);

        return update.map(gradientArray => 
            gradientArray.map(val => {
                const noise = this.laplaceNoise(scale);
                return val + noise;
            })
        );
    }

    /**
     * Generate Laplacian noise
     */
    laplaceNoise(scale) {
        const u = Math.random() - 0.5;
        return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        return headers;
    }

    /**
     * Get client status
     */
    getStatus() {
        return {
            org_id: this.orgId,
            org_name: this.orgName,
            coordinator_url: this.coordinatorUrl,
            current_round: this.currentRound,
            is_registered: this.isRegistered,
            training_history_count: this.localTrainer.getTrainingHistory().length
        };
    }
}

module.exports = FederatedClient;

