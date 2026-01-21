# Quick Start Guide - Cloud-Native Consearch App

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker & Docker Compose installed
- Git installed
- 4GB RAM available

### Option 1: Docker Compose (Local Development)

#### 1. Clone & Setup
```bash
cd consearch-app-main
cp .env.example .env  # atau create .env manually
```

#### 2. Generate SSL Certificates
```bash
bash ssl/generate-certs.sh
# or on Windows:
cd ssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=ID/ST=State/L=City/O=Organization/CN=localhost"
```

#### 3. Deploy
```bash
# Linux/Mac:
bash deploy.sh docker-compose

# Windows:
deploy.bat
```

#### 4. Access Services
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **AlertManager**: http://localhost:9093

### Option 2: Kubernetes (Production)

#### 1. Prerequisites
```bash
# Install kubectl
# Install & configure Kubernetes cluster (minikube/kind/AKS/EKS/GKE)

# Verify cluster access
kubectl cluster-info
```

#### 2. Deploy
```bash
# Linux/Mac:
bash deploy.sh kubernetes

# Windows: (requires kubectl + helm)
kubectl apply -f k8s/00-namespace-configmap.yaml
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-nginx.yaml
kubectl apply -f k8s/04-prometheus.yaml
kubectl apply -f k8s/05-grafana.yaml
kubectl apply -f k8s/06-alertmanager.yaml
```

#### 3. Verify Deployment
```bash
kubectl -n consearch get pods
kubectl -n consearch get svc
```

#### 4. Port Forward
```bash
# Access Grafana
kubectl -n consearch port-forward svc/grafana 3000:3000

# Access Prometheus
kubectl -n consearch port-forward svc/prometheus 9090:9090

# Access Nginx
kubectl -n consearch port-forward svc/nginx 8080:8080
```

## 📋 Common Tasks

### View Logs

#### Docker Compose:
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

#### Kubernetes:
```bash
# Backend logs
kubectl -n consearch logs -f deployment/backend

# Database logs
kubectl -n consearch logs -f deployment/postgres

# All pod logs
kubectl -n consearch logs -f --all-containers=true pods
```

### Scale Services

#### Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

#### Kubernetes:
```bash
# Scale backend to 5 replicas
kubectl -n consearch scale deployment backend --replicas=5

# Check HPA status
kubectl -n consearch get hpa
```

### Update Configuration

#### Docker Compose:
```bash
# Edit .env file
nano .env

# Restart services
docker-compose -f docker-compose.prod.yml restart backend
```

#### Kubernetes:
```bash
# Edit ConfigMap
kubectl -n consearch edit configmap backend-config

# Restart pods to apply changes
kubectl -n consearch rollout restart deployment/backend
```

### Backup Database

#### Docker Compose:
```bash
# Backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U consearch_user consearch_db > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U consearch_user consearch_db < backup.sql
```

#### Kubernetes:
```bash
# Backup
kubectl -n consearch exec -it deployment/postgres -- pg_dump -U consearch_user consearch_db > backup.sql

# Restore
kubectl -n consearch exec -it deployment/postgres -- psql -U consearch_user consearch_db < backup.sql
```

### Monitor Performance

#### Access Grafana Dashboards:
1. Go to http://localhost:3001
2. Login (admin/admin)
3. Check "Backend Monitoring" dashboard

#### View Prometheus Metrics:
1. Go to http://localhost:9090
2. Click "Graph"
3. Query examples:
   - `http_requests_total` - Total requests
   - `rate(http_requests_total[5m])` - Request rate
   - `http_request_duration_seconds_bucket` - Latency buckets

### Troubleshooting

#### Containers won't start

```bash
# Docker Compose - check logs
docker-compose -f docker-compose.prod.yml logs

# Kubernetes - check events
kubectl -n consearch describe pod <pod-name>
```

#### Database connection error

```bash
# Docker Compose - test connection
docker-compose -f docker-compose.prod.yml exec backend curl postgres:5432

# Kubernetes - test connection
kubectl -n consearch exec -it deployment/backend -- nc -zv postgres 5432
```

#### High resource usage

```bash
# Docker Compose - check resource limits
docker stats

# Kubernetes - check requests/limits
kubectl -n consearch describe node
kubectl top pods -n consearch
```

#### Services not responding

```bash
# Docker Compose - health check
docker-compose -f docker-compose.prod.yml ps

# Kubernetes - check readiness
kubectl -n consearch get pods -o wide
kubectl -n consearch describe pod <pod-name>
```

## 🔒 Security Configuration

### Change Default Passwords

1. **Edit .env file:**
```bash
POSTGRES_PASSWORD=your_strong_password
JWT_SECRET=your_complex_jwt_secret
SESSION_SECRET=your_complex_session_secret
GF_SECURITY_ADMIN_PASSWORD=your_grafana_password
```

2. **Restart services:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Enable HTTPS in Production

1. **Get real SSL certificates:**
```bash
# Using Let's Encrypt (requires domain)
certbot certonly --standalone -d yourdomain.com
```

2. **Update nginx.conf:**
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

3. **Restart Nginx:**
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### Network Security

```bash
# Docker Compose - restrict network access
docker network inspect consearch-network

# Kubernetes - apply network policies
kubectl apply -f k8s/03-nginx.yaml  # Includes NetworkPolicy
```

## 📊 Monitoring Checklist

- [ ] Prometheus scraping metrics ✓
- [ ] Grafana dashboards displaying data ✓
- [ ] AlertManager receiving alerts ✓
- [ ] Backend health check passing ✓
- [ ] Database connections stable ✓
- [ ] Nginx reverse proxy working ✓
- [ ] Resource usage within limits ✓
- [ ] No error spikes in logs ✓

## 📞 Support & Documentation

- **Architecture**: [CLOUD_NATIVE_ARCHITECTURE.md](CLOUD_NATIVE_ARCHITECTURE.md)
- **Monitoring**: [MONITORING_GUIDE.md](MONITORING_GUIDE.md)
- **API**: [API Documentation](http://localhost:3000/api)
- **Kubernetes**: `kubectl -n consearch --help`

## ⚡ Performance Tips

### Optimize Docker Compose:
- Use BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`
- Increase Docker resources allocation
- Use volume mounts efficiently

### Optimize Kubernetes:
- Set appropriate resource requests/limits
- Enable horizontal pod autoscaling (HPA)
- Use node affinity rules
- Implement pod disruption budgets

### Application Optimization:
- Implement caching (Redis)
- Database query optimization
- Connection pooling
- Load testing & benchmarking

## 🔄 CI/CD Integration

### GitHub Actions Example:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: docker build -f Dockerfile.prod -t consearch/backend:latest .
      - name: Test
        run: npm test
      - name: Deploy
        run: |
          docker push consearch/backend:latest
          kubectl apply -f k8s/
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
