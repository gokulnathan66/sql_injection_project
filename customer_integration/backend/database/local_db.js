/**
 * Local Training Database
 * Organization-specific database for storing attack data and training information
 * Separate from main backend knowledge base
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class LocalTrainingDatabase {
    constructor(dbPath = './data/local_training.db') {
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening local training database:', err.message);
            } else {
                console.log('✓ Local training database connected');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        // Local attacks table (organization-specific)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS local_attacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                query TEXT NOT NULL,
                normalized_query TEXT,
                is_malicious INTEGER NOT NULL,
                confidence REAL NOT NULL,
                attack_type TEXT,
                source_ip TEXT,
                user_agent TEXT,
                response_time_ms REAL,
                processed_for_training INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating local_attacks table:', err.message);
            }
        });

        // Training data table (features + labels)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS training_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attack_id INTEGER,
                features TEXT NOT NULL,
                label INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                used_in_round INTEGER,
                FOREIGN KEY (attack_id) REFERENCES local_attacks(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating training_data table:', err.message);
            }
        });

        // Model versions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS model_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER UNIQUE NOT NULL,
                global_version INTEGER,
                created_at TEXT NOT NULL,
                model_path TEXT,
                metrics TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error creating model_versions table:', err.message);
            }
        });

        // Training logs
        this.db.run(`
            CREATE TABLE IF NOT EXISTS training_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_number INTEGER NOT NULL,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                samples_used INTEGER,
                metrics TEXT,
                status TEXT DEFAULT 'pending'
            )
        `, (err) => {
            if (err) {
                console.error('Error creating training_logs table:', err.message);
            }
        });

        // Federated status
        this.db.run(`
            CREATE TABLE IF NOT EXISTS federated_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                org_id TEXT UNIQUE NOT NULL,
                coordinator_url TEXT,
                registered_at TEXT,
                last_sync TEXT,
                current_round INTEGER DEFAULT 0,
                status TEXT DEFAULT 'disconnected'
            )
        `, (err) => {
            if (err) {
                console.error('Error creating federated_status table:', err.message);
            } else {
                console.log('✓ Local training database tables initialized');
            }
        });
    }

    /**
     * Store local attack (separate from main backend knowledge base)
     */
    storeLocalAttack(attackData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO local_attacks (
                    timestamp, query, normalized_query, is_malicious,
                    confidence, attack_type, source_ip, user_agent, response_time_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(query, [
                new Date().toISOString(),
                attackData.query,
                attackData.normalized_query || null,
                attackData.is_malicious ? 1 : 0,
                attackData.confidence || 0.0,
                attackData.attack_type || null,
                attackData.source_ip || null,
                attackData.user_agent || null,
                attackData.response_time_ms || null
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Get unprocessed attacks for training
     */
    getUnprocessedAttacks(limit = 1000) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM local_attacks
                WHERE processed_for_training = 0
                ORDER BY timestamp DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Mark attacks as processed
     */
    markAsProcessed(attackIds) {
        return new Promise((resolve, reject) => {
            const placeholders = attackIds.map(() => '?').join(',');
            const query = `
                UPDATE local_attacks
                SET processed_for_training = 1
                WHERE id IN (${placeholders})
            `;
            this.db.run(query, attackIds, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    /**
     * Store training data (features and labels)
     */
    storeTrainingData(attackId, features, label, roundNumber = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO training_data (attack_id, features, label, created_at, used_in_round)
                VALUES (?, ?, ?, ?, ?)
            `;
            this.db.run(query, [
                attackId,
                JSON.stringify(features),
                label,
                new Date().toISOString(),
                roundNumber
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Log training session
     */
    logTrainingSession(roundNumber, samplesUsed, metrics, status = 'completed') {
        return new Promise((resolve, reject) => {
            const startedAt = new Date().toISOString();
            const completedAt = status === 'completed' ? startedAt : null;
            const query = `
                INSERT INTO training_logs (round_number, started_at, completed_at, samples_used, metrics, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            this.db.run(query, [
                roundNumber,
                startedAt,
                completedAt,
                samplesUsed,
                JSON.stringify(metrics),
                status
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Update federated status
     */
    updateFederatedStatus(orgId, coordinatorUrl, currentRound, status) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO federated_status 
                (org_id, coordinator_url, registered_at, last_sync, current_round, status)
                VALUES (?, ?, COALESCE((SELECT registered_at FROM federated_status WHERE org_id = ?), ?), ?, ?, ?)
            `;
            this.db.run(query, [
                orgId,
                coordinatorUrl,
                orgId,
                new Date().toISOString(),
                new Date().toISOString(),
                currentRound,
                status
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Get federated status
     */
    getFederatedStatus() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM federated_status
                ORDER BY id DESC
                LIMIT 1
            `, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as total_attacks,
                    SUM(CASE WHEN is_malicious = 1 THEN 1 ELSE 0 END) as malicious_attacks,
                    SUM(CASE WHEN processed_for_training = 0 THEN 1 ELSE 0 END) as unprocessed_attacks,
                    AVG(confidence) as avg_confidence
                FROM local_attacks
            `, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = LocalTrainingDatabase;

