# Cloud-Native Architecture Documentation

## 📋 Arsitektur Sistem Consearch App

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloud-Native Architecture                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                     (Frontend / Web Browser)                         │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       INGRESS / LOADBALANCER                         │
│  (Nginx - Reverse Proxy, Rate Limiting, SSL Termination)            │
│  - Port 80 (HTTP)                                                    │
│  - Port 443 (HTTPS)                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
        ┌───────────────────────┬───────────────────────┐
        ↓                       ↓                       ↓
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│  STATIC FILES   │  │   BACKEND API   │  │   MONITORING/LOGS    │
│   (Frontend)    │  │  (Node.js + Exp)│  │    (Observability)   │
│                 │  │                 │  │                      │
│  - HTML/CSS/JS  │  │  - REST API     │  │  ┌────────────────┐  │
│  - Images       │  │  - Auth System  │  │  │  Prometheus    │  │
│  - Assets       │  │  - Business     │  │  │  (Metrics)     │  │
│                 │  │    Logic        │  │  └────────────────┘  │
│                 │  │  - Health Check │  │  ┌────────────────┐  │
│                 │  │  (3 replicas)   │  │  │  Grafana       │  │
│                 │  │  - HPA: 2-5     │  │  │  (Dashboards)  │  │
└─────────────────┘  └─────────────────┘  │  └────────────────┘  │
                                           │  ┌────────────────┐  │
                                           │  │  AlertManager  │  │
                                           │  │  (Alerts)      │  │
                                           │  └────────────────┘  │
                                           └──────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
│                   PostgreSQL Database                                │
│  - Primary database for application data                            │
│  - Persistent storage (PVC 10GB)                                    │
│  - Replication & backup ready                                       │
│  - Connection pooling                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## 🏗️ Komponen Arsitektur

### 1. Frontend Layer
- **Nginx Reverse Proxy**
  - Reverse proxy untuk backend
  - Melayani static files (HTML, CSS, JS)
  - SSL/TLS termination
  - Rate limiting (10 req/s untuk API, 5 req/s untuk auth)
  - Gzip compression
  - Security headers
  - Load balancing

### 2. Backend API Layer
- **Node.js + Express.js**
  - 3 replicas di production
  - Horizontal Pod Autoscaler (HPA: 2-5 replicas)
  - Resource limits: 256MB-512MB memory, 250-500m CPU
  - Health checks (liveness & readiness probes)
  - JWT authentication
  - Session management
  - Business logic

### 3. Database Layer
- **PostgreSQL 16**
  - Persistent storage (PVC 10GB)
  - High availability configuration
  - Automatic backups
  - Connection pooling
  - ACID compliance
  - Tables untuk users, tickets, audit logs

### 4. Monitoring & Observability Stack
- **Prometheus**
  - Time-series database untuk metrics
  - Scrapes metrics setiap 15 detik
  - 30 hari retention
  - Custom alerts untuk error rate, memory, CPU

- **Grafana**
  - Visualization dashboards
  - Pre-configured datasources
  - Backend monitoring dashboard
  - Alert management

- **AlertManager**
  - Alert routing & grouping
  - Notification channels (email, Slack, PagerDuty)
  - Alert rules untuk critical & warning severity

## 🚀 Deployment Options

### Option 1: Docker Compose (Development/Staging)
```bash
# Build dan run semua services
docker-compose -f docker-compose.prod.yml up -d

# Services yang berjalan:
# - Backend: http://localhost:3000
# - Nginx: http://localhost:80
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
# - AlertManager: http://localhost:9093
# - PostgreSQL: localhost:5432
```

### Option 2: Kubernetes (Production)
```bash
# 1. Create namespace dan resources
kubectl apply -f k8s/00-namespace-configmap.yaml
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-nginx.yaml
kubectl apply -f k8s/04-prometheus.yaml
kubectl apply -f k8s/05-grafana.yaml
kubectl apply -f k8s/06-alertmanager.yaml

# 2. Check status
kubectl -n consearch get pods
kubectl -n consearch get svc

# 3. Port forward untuk akses lokal
kubectl -n consearch port-forward svc/grafana 3000:3000
kubectl -n consearch port-forward svc/prometheus 9090:9090
```

## 🔒 Security Features

### Network Security
- Network policies untuk pod isolation
- Service accounts dengan RBAC
- Pod security context (non-root user)
- Read-only root filesystem (where possible)
- Dropped capabilities

### Data Security
- Encrypted secrets di Kubernetes
- HTTPS/TLS support
- Password hashing (bcryptjs)
- JWT token management
- Session management

### API Security
- Rate limiting (Nginx)
- CORS protection
- SQL injection prevention (prepared statements)
- XSS protection headers
- HSTS (Strict-Transport-Security)

## 📊 Monitoring & Metrics

### Backend Metrics
- `http_requests_total` - Total requests per method, route, status
- `http_request_duration_seconds` - Response time histogram
- `tickets_sold_total` - Business metric

### System Metrics
- Container memory usage
- Container CPU usage
- Network I/O
- Disk usage
- Pod restart count

### Alerts yang Dikonfigurasi
1. **HighErrorRate** (critical)
   - Trigger: Error rate > 5% selama 5 menit
   
2. **HighMemoryUsage** (warning)
   - Trigger: Memory > 80% selama 2 menit
   
3. **HighCPUUsage** (warning)
   - Trigger: CPU > 70% selama 2 menit
   
4. **BackendDown** (critical)
   - Trigger: Backend pod down selama 2 menit
   
5. **PostgresDown** (critical)
   - Trigger: Database unavailable selama 2 menit

## 📁 File Structure

```
consearch-app/
├── app.js                          # Backend application
├── package.json                    # Dependencies
├── init.sql                        # Database initialization
│
├── Dockerfile                      # Development container
├── Dockerfile.prod                 # Production container
│
├── docker-compose.yml              # Development setup
├── docker-compose.prod.yml         # Production setup
│
├── nginx/
│   ├── nginx.conf                  # Nginx configuration
│   └── Dockerfile                  # Nginx container
│
├── ssl/
│   ├── generate-certs.sh          # Certificate generation script
│   ├── cert.pem                    # SSL certificate
│   └── key.pem                     # SSL private key
│
├── k8s/
│   ├── 00-namespace-configmap.yaml # Namespace & configs
│   ├── 01-postgres.yaml            # Database deployment
│   ├── 02-backend.yaml             # Backend deployment
│   ├── 03-nginx.yaml               # Frontend deployment
│   ├── 04-prometheus.yaml          # Monitoring
│   ├── 05-grafana.yaml             # Dashboards
│   └── 06-alertmanager.yaml        # Alerts
│
├── public/
│   ├── index.html                  # Frontend
│   ├── login.html
│   ├── register.html
│   └── images/
│
├── prometheus.yml                  # Prometheus configuration
├── grafana/                        # Grafana configurations
├── alertmanager/                   # AlertManager config
│
└── CLOUD_NATIVE_ARCHITECTURE.md   # This file
```

## 🔄 CI/CD Pipeline Recommendations

### GitHub Actions Workflow
```yaml
- Build Docker images
- Run security scans (Trivy, OWASP)
- Unit tests
- Integration tests
- Push to registry
- Deploy to staging (Docker Compose)
- Deploy to production (Kubernetes)
- Smoke tests
- Monitor metrics
```

## 📈 Scaling Strategy

### Horizontal Scaling
- Nginx: 2+ replicas with LoadBalancer
- Backend: 2-5 replicas with HPA
- PostgreSQL: 1 primary + N replicas (optional)

### Vertical Scaling
- Adjust resource requests/limits
- Optimize database queries
- Implement caching (Redis)
- Database connection pooling

## 🔧 Configuration Management

### Environment Variables
- `NODE_ENV`: Environment type
- `DATABASE_URL`: Database connection
- `JWT_SECRET`: Token secret
- `SESSION_SECRET`: Session secret
- `LOG_LEVEL`: Logging level

### Secrets Management
- Kubernetes Secrets (encrypted etcd)
- HashiCorp Vault (optional)
- AWS Secrets Manager (if AWS)
- Azure Key Vault (if Azure)

## 📝 Deployment Checklist

- [ ] Generate SSL certificates
- [ ] Configure environment variables
- [ ] Set secure database password
- [ ] Configure monitoring alerts
- [ ] Set up log aggregation
- [ ] Configure backup strategy
- [ ] Test disaster recovery
- [ ] Load testing
- [ ] Security audit
- [ ] Performance testing

## 🔗 References & Documentation

- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
