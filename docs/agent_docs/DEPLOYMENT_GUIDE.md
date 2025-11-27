# Cloud Deployment Guide - SQL Injection Mitigation Framework

## Overview

This guide covers deploying the SQL Injection Mitigation Framework to AWS EC2 using Docker containers.

## Architecture

- **Coordinator EC2**: Single EC2 instance running Docker container with:
  - Detection engine
  - Honeypot service
  - Proxy service
  - Federated learning coordinator
  
- **Organization EC2s**: Separate EC2 instances (one per organization) running Docker containers with:
  - Local training manager
  - Federated learning client

## Prerequisites

- AWS account with EC2 access
- Docker installed locally (for building images)
- SSH access to EC2 instances

## Phase 1: Build Docker Images

### Build Coordinator Image

```bash
cd backend
docker build -f Dockerfile.coordinator -t sqli-coordinator:latest .
```

### Build Organization Image

```bash
cd backend
docker build -f Dockerfile.organization -t sqli-organization:latest .
```

## Phase 2: Deploy Coordinator EC2

### Step 1: Launch EC2 Instance

1. Launch EC2 instance:
   - Instance Type: t3.medium (2 vCPU, 4GB RAM)
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Storage: 20GB EBS volume
   - Security Group: Allow ports 8000, 9000, 22, 443

### Step 2: Install Docker on EC2

**For Amazon Linux:**
```bash
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
```

**For Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### Step 3: Transfer Files to EC2

```bash
# From local machine
scp -r backend/ ec2-user@<coordinator-ip>:~/sqli-backend/
scp docker-compose.coordinator.yml ec2-user@<coordinator-ip>:~/
```

### Step 4: Build and Run Coordinator Container

```bash
# SSH into EC2
ssh ec2-user@<coordinator-ip>

# Navigate to backend directory
cd sqli-backend

# Build image
docker build -f Dockerfile.coordinator -t sqli-coordinator:latest .

# Run container
docker run -d \
  --name sqli-coordinator \
  -p 8000:8000 \
  -p 9000:9000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/app/models:/app/models \
  -e APP_MODE=coordinator \
  sqli-coordinator:latest
```

Or use docker-compose:

```bash
docker-compose -f ../docker-compose.coordinator.yml up -d
```

### Step 5: Verify Coordinator

```bash
# Check container status
docker ps

# Check logs
docker logs sqli-coordinator

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/
```

## Phase 3: Deploy Organization EC2s

### Step 1: Launch EC2 Instance

1. Launch EC2 instance for each organization:
   - Instance Type: t3.small (2 vCPU, 2GB RAM)
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Storage: 20GB EBS volume
   - Security Group: Allow ports 8001, 22, 443

### Step 2: Install Docker (same as coordinator)

### Step 3: Transfer Files

```bash
scp -r backend/ ec2-user@<org-ip>:~/sqli-backend/
scp docker-compose.organization.yml ec2-user@<org-ip>:~/
```

### Step 4: Configure Environment

Create `.env` file on organization EC2:

```bash
cd sqli-backend
cat > .env << EOF
APP_MODE=organization
API_PORT=8001
ORG_ID=org-001
ORG_NAME=Organization A
COORDINATOR_URL=http://<coordinator-ip>:8000
COORDINATOR_API_KEY=
DATA_PATH=/app/data/local
MODEL_PATH=/app/models/local
EOF
```

### Step 5: Build and Run Organization Container

```bash
# Build image
docker build -f Dockerfile.organization -t sqli-organization:latest .

# Run container
docker run -d \
  --name sqli-organization \
  -p 8001:8001 \
  -v $(pwd)/data/local:/app/data/local \
  -v $(pwd)/models/local:/app/models/local \
  --env-file .env \
  sqli-organization:latest
```

Or use docker-compose:

```bash
export COORDINATOR_URL=http://<coordinator-ip>:8000
export ORG_ID=org-001
export ORG_NAME="Organization A"
docker-compose -f ../docker-compose.organization.yml up -d
```

### Step 6: Register Organization

```bash
# Register with coordinator
curl -X POST http://<coordinator-ip>:8000/api/federated/register \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org-001",
    "org_name": "Organization A",
    "address": "<org-ip>"
  }'
```

## Phase 4: Testing

### Test Coordinator

```bash
# Health check
curl http://<coordinator-ip>:8000/health

# Check federated status
curl http://<coordinator-ip>:8000/api/federated/status

# Test detection
curl -X POST http://<coordinator-ip>:8000/api/detect \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE id = 1"}'
```

### Test Organization

```bash
# Health check
curl http://<org-ip>:8001/health

# Download global model
curl http://<org-ip>:8001/api/federated/download-model
```

### Test Federated Learning Round

```bash
# Start a federated learning round
curl -X POST http://<coordinator-ip>:8000/api/federated/start-round \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Phase 5: Monitoring

### View Logs

```bash
# Coordinator logs
docker logs -f sqli-coordinator

# Organization logs
docker logs -f sqli-organization
```

### Check Container Status

```bash
docker ps
docker stats
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker logs <container-name>`
2. Verify ports are not in use: `netstat -tulpn | grep <port>`
3. Check disk space: `df -h`

### Connection Issues

1. Verify security groups allow traffic
2. Check firewall rules
3. Test connectivity: `curl http://<ip>:<port>/health`

### Database Issues

1. Check data directory permissions
2. Verify database file exists: `ls -la data/knowledge_base.db`
3. Check database logs in container

## Security Considerations

1. **Use HTTPS**: Set up SSL/TLS certificates for production
2. **API Keys**: Implement proper authentication for federated endpoints
3. **Firewall**: Restrict access to necessary ports only
4. **Secrets**: Use AWS Secrets Manager for sensitive data
5. **Updates**: Keep Docker and system packages updated

## Scaling

### Horizontal Scaling

- Deploy multiple coordinator instances behind a load balancer
- Use multiple organization instances per organization

### Vertical Scaling

- Increase EC2 instance sizes for higher throughput
- Add more CPU/memory for larger models

## Backup and Recovery

### Backup Database

```bash
# On coordinator EC2
docker exec sqli-coordinator cp /app/data/knowledge_base.db /app/data/backup-$(date +%Y%m%d).db
```

### Restore Database

```bash
docker exec sqli-coordinator cp /app/data/backup-YYYYMMDD.db /app/data/knowledge_base.db
docker restart sqli-coordinator
```

## Next Steps

1. Set up monitoring (CloudWatch, Prometheus)
2. Implement automated backups
3. Configure auto-scaling
4. Set up CI/CD pipeline
5. Add comprehensive logging

