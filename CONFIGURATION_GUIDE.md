# Cloud-Native Architecture - Environment Variables & Configuration

## 📝 Environment Configuration

### .env File Template

```bash
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
POSTGRES_USER=consearch_user
POSTGRES_PASSWORD=consearch_password_change_in_production
POSTGRES_DB=consearch_db
DATABASE_URL=postgresql://consearch_user:consearch_password_change_in_production@postgres:5432/consearch_db

# ==========================================
# NODE.JS CONFIGURATION
# ==========================================
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# ==========================================
# SECURITY & AUTHENTICATION
# ==========================================
JWT_SECRET=your-jwt-secret-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production
JWT_EXPIRATION=24h

# ==========================================
# GRAFANA CONFIGURATION
# ==========================================
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
GF_SERVER_ROOT_URL=http://localhost:3001
GF_PATHS_CONFIG=/etc/grafana/grafana.ini

# ==========================================
# NGINX CONFIGURATION
# ==========================================
NGINX_WORKER_PROCESSES=auto
NGINX_WORKER_CONNECTIONS=1024

# ==========================================
# MONITORING & OBSERVABILITY
# ==========================================
METRICS_PORT=3000
PROMETHEUS_SCRAPE_INTERVAL=15s
PROMETHEUS_RETENTION_TIME=30d

# ==========================================
# CORS & SECURITY HEADERS
# ==========================================
CORS_ORIGIN=http://localhost
CORS_CREDENTIALS=true
```

## 🔐 Production Security Checklist

### Database
- [ ] Change `POSTGRES_PASSWORD` to strong password (min 32 chars)
- [ ] Enable SSL for database connections
- [ ] Configure database backups
- [ ] Enable audit logging
- [ ] Restrict database network access

### Authentication
- [ ] Change `JWT_SECRET` to random string (openssl rand -hex 32)
- [ ] Change `SESSION_SECRET` to random string
- [ ] Implement refresh token rotation
- [ ] Enable rate limiting on auth endpoints
- [ ] Implement CAPTCHA for login attempts

### API Security
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly (not allow *)
- [ ] Implement API key management
- [ ] Enable request validation
- [ ] Set up request/response logging
- [ ] Implement DDoS protection

### Infrastructure
- [ ] Configure firewall rules
- [ ] Enable VPC isolation
- [ ] Configure load balancer security groups
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure VPN for access

### Secrets Management
- [ ] Use secrets manager (Kubernetes Secrets, Vault, AWS Secrets Manager)
- [ ] Rotate secrets regularly
- [ ] Audit secret access
- [ ] Never commit secrets to git

### Monitoring & Logging
- [ ] Configure centralized logging
- [ ] Set up security monitoring
- [ ] Enable audit logging
- [ ] Configure alerting for security events
- [ ] Regular security log review

## 🔄 Kubernetes ConfigMaps & Secrets

### Creating Secrets in Kubernetes

```bash
# Create secret from literal values
kubectl -n consearch create secret generic backend-secret \
  --from-literal=JWT_SECRET=$(openssl rand -hex 32) \
  --from-literal=SESSION_SECRET=$(openssl rand -hex 32) \
  --from-literal=DATABASE_URL="postgresql://user:pass@postgres:5432/db"

# Create secret from file
kubectl -n consearch create secret generic backend-secret \
  --from-file=.env

# View secret (base64 decoded)
kubectl -n consearch get secret backend-secret -o jsonpath='{.data.JWT_SECRET}' | base64 --decode

# Update secret
kubectl -n consearch delete secret backend-secret
kubectl -n consearch create secret generic backend-secret \
  --from-literal=JWT_SECRET=$(openssl rand -hex 32)
kubectl -n consearch rollout restart deployment/backend
```

### Creating ConfigMaps in Kubernetes

```bash
# Create ConfigMap from literal values
kubectl -n consearch create configmap backend-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info

# Create ConfigMap from file
kubectl -n consearch create configmap nginx-config \
  --from-file=nginx/nginx.conf

# View ConfigMap
kubectl -n consearch get configmap backend-config -o yaml
```

## 🚀 Deployment Profiles

### Development Profile

```yaml
# docker-compose.dev.yml
services:
  backend:
    environment:
      NODE_ENV: development
      LOG_LEVEL: debug
      DEBUG: true
    ports:
      - "3000:3000"
    volumes:
      - ./app.js:/app/app.js  # Hot reload
    restart: unless-stopped
```

### Staging Profile

```yaml
# docker-compose.staging.yml
services:
  backend:
    environment:
      NODE_ENV: staging
      LOG_LEVEL: info
    replicas: 2
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
```

### Production Profile

```yaml
# docker-compose.prod.yml (already created)
services:
  backend:
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
    replicas: 3
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

## 📦 Build Targets

### Docker Build Arguments

```dockerfile
# Dockerfile.prod
ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.18

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-ref=$VCS_REF
LABEL org.label-schema.version=$VERSION
```

### Build Command

```bash
docker build -f Dockerfile.prod \
  --build-arg NODE_VERSION=20 \
  --build-arg VERSION=1.0.0 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  -t consearch/backend:latest \
  -t consearch/backend:1.0.0 \
  .
```

## 🌐 DNS & Load Balancer Configuration

### Kubernetes Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: consearch-ingress
  namespace: consearch
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - consearch.example.com
    secretName: consearch-tls
  rules:
  - host: consearch.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx
            port:
              number: 8080
```

### AWS ALB Configuration

```hcl
# terraform/alb.tf
resource "aws_lb" "consearch" {
  name               = "consearch-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection = true
  enable_http2               = true
  enable_cross_zone_load_balancing = true
}

resource "aws_lb_target_group" "consearch" {
  name        = "consearch-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
}
```

## 🔍 Health Check Endpoints

### Backend Health Endpoints

```javascript
// app.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/health/live', (req, res) => {
  // Liveness probe
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  // Readiness probe - check dependencies
  pool.query('SELECT 1', (err, result) => {
    if (err) {
      res.status(503).json({ status: 'not_ready', error: err.message });
    } else {
      res.status(200).json({ status: 'ready' });
    }
  });
});

app.get('/health/startup', (req, res) => {
  // Startup probe - check initialization
  res.status(200).json({ status: 'started', timestamp: new Date() });
});
```

## 📈 Resource Allocation Guidelines

### CPU
- **Development**: 100m per pod
- **Staging**: 250m per pod
- **Production**: 500m+ per pod

### Memory
- **Development**: 128Mi per pod
- **Staging**: 256Mi per pod
- **Production**: 512Mi+ per pod

### Storage
- **Database**: 10Gi (development) → 100Gi+ (production)
- **Logs**: 5Gi (retention based on log level)
- **Cache**: 2Gi (if using Redis)

## 🔄 Rollout Strategy

### Blue-Green Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-blue
spec:
  selector:
    matchLabels:
      app: backend
      version: v1.0.0
  template:
    metadata:
      labels:
        app: backend
        version: v1.0.0
    spec:
      containers:
      - name: backend
        image: consearch/backend:v1.0.0
```

### Canary Deployment

```yaml
apiVersion: fluxcd.io/v1beta1
kind: Canary
metadata:
  name: backend
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  progressDeadlineSeconds: 300
  service:
    port: 3000
    targetPort: 3000
  analysis:
    interval: 1m
    threshold: 10
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
```

## 🎯 Performance Tuning

### Nginx Tuning

```nginx
# nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
}

http {
    tcp_nodelay on;
    tcp_nopush on;
    sendfile on;
    keepalive_timeout 30s;
    
    # Connection pooling
    upstream backend {
        keepalive 32;
        least_conn;
    }
}
```

### PostgreSQL Tuning

```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB
max_connections = 200
max_parallel_workers = 4
```

---

**Version**: 1.0.0 | **Last Updated**: January 2026
