# Cloud-Native Consearch App - Complete Architecture

## 📦 Project Overview

Consearch adalah aplikasi web berbasis cloud-native dengan arsitektur lengkap yang meliputi:

- **Frontend**: Static files (HTML, CSS, JS) yang disajikan melalui Nginx
- **Backend**: Node.js + Express.js REST API
- **Database**: PostgreSQL untuk persistent storage
- **Reverse Proxy**: Nginx dengan load balancing dan SSL termination
- **Monitoring**: Prometheus + Grafana + AlertManager untuk observability

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐
│  Web Browser    │
└────────┬────────┘
         │ HTTP/HTTPS
┌────────▼────────────────────────────────────────┐
│  Nginx (Reverse Proxy, Load Balancer, SSL)     │
│  - Port 80/443                                  │
│  - Rate limiting                                │
│  - Gzip compression                             │
│  - Security headers                             │
└─┬─────────────────────────────────┬────────────┘
  │                                 │
  ▼                                 ▼
┌──────────────┐            ┌──────────────────────┐
│ Static Files │            │  Backend API Pods    │
│ (Frontend)   │            │  (Node.js - 3x)      │
└──────────────┘            │  - Port 3000         │
                            │  - HPA: 2-5 replicas │
                            │  - Health checks     │
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │  PostgreSQL Database  │
                            │  - Port 5432          │
                            │  - Persistent Storage │
                            │  - 10GB PVC           │
                            └───────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Monitoring Stack                                     │
├──────────┬────────────────┬───────────────┐          │
│Prometheus│ Grafana        │ AlertManager  │          │
│ Port 9090│ Port 3001      │ Port 9093     │          │
│ Metrics  │ Dashboards     │ Alerts        │          │
└──────────┴────────────────┴───────────────┘          │
└──────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Docker Compose (Untuk Development/Staging)

```bash
# 1. Clone repository
cd consearch-app-main

# 2. Generate SSL certificates
bash ssl/generate-certs.sh

# 3. Deploy
bash deploy.sh docker-compose

# 4. Access services
# Frontend: http://localhost:80
# Backend: http://localhost:3000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

### Kubernetes (Untuk Production)

```bash
# 1. Build Docker image
docker build -f Dockerfile.prod -t consearch/backend:latest .

# 2. Deploy to Kubernetes
bash deploy.sh kubernetes

# 3. Verify
kubectl -n consearch get pods
kubectl -n consearch get svc

# 4. Port forward untuk akses
kubectl -n consearch port-forward svc/grafana 3000:3000
```

## 📁 Struktur Folder

```
consearch-app/
├── app.js                              # Backend application (Node.js)
├── package.json                        # Dependencies
├── init.sql                            # Database initialization
├── public/                             # Frontend static files
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── images/
├── nginx/                              # Nginx configuration
│   ├── nginx.conf                      # Main config
│   └── Dockerfile                      # Container image
├── ssl/                                # SSL certificates
│   ├── generate-certs.sh              # Certificate generation
│   ├── cert.pem                        # SSL certificate
│   └── key.pem                         # Private key
├── k8s/                                # Kubernetes manifests
│   ├── 00-namespace-configmap.yaml     # Namespace & ConfigMap
│   ├── 01-postgres.yaml                # Database
│   ├── 02-backend.yaml                 # Backend API
│   ├── 03-nginx.yaml                   # Frontend/Proxy
│   ├── 04-prometheus.yaml              # Monitoring
│   ├── 05-grafana.yaml                 # Dashboards
│   └── 06-alertmanager.yaml            # Alerts
├── grafana/                            # Grafana configurations
│   └── provisioning/
├── alertmanager/                       # AlertManager config
│   └── alertmanager.yml
├── docker-compose.yml                  # Development setup
├── docker-compose.prod.yml             # Production setup
├── Dockerfile                          # Development image
├── Dockerfile.prod                     # Production image
├── deploy.sh                           # Deployment script (Linux/Mac)
├── deploy.bat                          # Deployment script (Windows)
├── prometheus.yml                      # Prometheus config
├── .env.example                        # Environment variables template
├── CLOUD_NATIVE_ARCHITECTURE.md        # Architecture documentation
├── MONITORING_GUIDE.md                 # Monitoring setup guide
├── QUICKSTART_CLOUD_NATIVE.md          # Quick start guide
└── CONFIGURATION_GUIDE.md              # Configuration reference
```

## 🔧 Komponen & Teknologi

### Frontend
- **HTML5/CSS3/JavaScript** - Web interface
- **Nginx 1.25-Alpine** - Reverse proxy & static file server
- **Load Balancer** - 2+ Nginx replicas

### Backend
- **Node.js 20** - Runtime
- **Express.js 4.22** - Web framework
- **PostgreSQL 16** - Database
- **bcryptjs** - Password hashing
- **JWT** - Authentication
- **Prometheus client** - Metrics

### Monitoring
- **Prometheus** - Metrics collection & storage
- **Grafana** - Visualization & dashboards
- **AlertManager** - Alert routing & management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local orchestration
- **Kubernetes** - Production orchestration
- **Nginx** - Reverse proxy & load balancing

## 📊 Monitoring & Observability

### Metrics Dikumpulkan
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Response time
- `tickets_sold_total` - Business metric
- CPU, Memory, Disk usage
- Pod restart count
- Network I/O

### Alerts yang Dikonfigurasi
1. **HighErrorRate** (>5% selama 5 menit) - Critical
2. **HighMemoryUsage** (>80% selama 2 menit) - Warning
3. **HighCPUUsage** (>70% selama 2 menit) - Warning
4. **BackendDown** (unreachable selama 2 menit) - Critical
5. **PostgresDown** (unreachable selama 2 menit) - Critical

### Grafana Dashboards
- Backend Monitoring (requests, errors, latency, resources)
- System Health (CPU, memory, disk)
- Database Performance (connections, queries)

## 🔒 Security Features

### Network Security
- Network policies untuk pod isolation (Kubernetes)
- Firewall rules
- Service accounts dengan RBAC

### Data Security
- HTTPS/TLS support
- Password hashing (bcryptjs)
- JWT token management
- Session encryption

### API Security
- Rate limiting (10 req/s untuk API, 5 req/s untuk auth)
- CORS protection
- SQL injection prevention (prepared statements)
- XSS protection headers
- HSTS (Strict-Transport-Security)

### Infrastructure Security
- Non-root container user
- Read-only root filesystem (where possible)
- Dropped capabilities
- Resource limits & requests
- Pod security policies

## 🚀 Deployment Options

### Option 1: Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Cocok untuk**: Development, Staging, Single-server deployments

**Services**: Backend, Frontend, Database, Monitoring stack

### Option 2: Kubernetes
```bash
kubectl apply -f k8s/
```

**Cocok untuk**: Production, High availability, Cloud platforms (AWS EKS, Google GKE, Azure AKS)

**Features**:
- Auto-scaling (HPA: 2-5 replicas)
- Self-healing
- Rolling updates
- Resource limits & requests
- Health checks (liveness, readiness, startup)
- Pod disruption budgets

## 📈 Scaling & Performance

### Horizontal Scaling
- **Nginx**: 2+ replicas dengan LoadBalancer
- **Backend**: 2-5 replicas dengan HPA
- **Database**: Primary + standby (optional)

### Vertical Scaling
- Adjust resource requests/limits
- Optimize database queries
- Implement caching (Redis)
- Database connection pooling

### Performance Optimization
- Nginx gzip compression
- Static file caching (24 hours)
- Browser caching headers
- Database query optimization
- Connection pooling

## 🔄 CI/CD Pipeline

Rekomendasi workflow:
1. **Build** - Docker image build
2. **Test** - Unit & integration tests
3. **Scan** - Security scanning (Trivy, OWASP)
4. **Push** - Push ke Docker registry
5. **Deploy Staging** - Deploy ke staging environment
6. **Tests** - Smoke tests & performance tests
7. **Deploy Production** - Deploy ke production
8. **Monitor** - Monitor metrics & logs

## 📝 Environment Variables

```bash
# Database
POSTGRES_USER=consearch_user
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=consearch_db

# Node.js
NODE_ENV=production
LOG_LEVEL=info

# Security
JWT_SECRET=your_complex_jwt_secret
SESSION_SECRET=your_complex_session_secret

# Monitoring
METRICS_PORT=3000
PROMETHEUS_SCRAPE_INTERVAL=15s
```

## 🔧 Common Tasks

### Scale Backend
```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Kubernetes
kubectl -n consearch scale deployment backend --replicas=5
```

### View Logs
```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f backend

# Kubernetes
kubectl -n consearch logs -f deployment/backend
```

### Backup Database
```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U consearch_user consearch_db > backup.sql

# Kubernetes
kubectl -n consearch exec deployment/postgres -- pg_dump -U consearch_user consearch_db > backup.sql
```

### Update Configuration
```bash
# Docker Compose
# Edit .env file
nano .env
docker-compose -f docker-compose.prod.yml restart backend

# Kubernetes
kubectl -n consearch edit configmap backend-config
kubectl -n consearch rollout restart deployment/backend
```

## 📚 Documentation

- **[CLOUD_NATIVE_ARCHITECTURE.md](CLOUD_NATIVE_ARCHITECTURE.md)** - Detailed architecture documentation
- **[MONITORING_GUIDE.md](MONITORING_GUIDE.md)** - Monitoring & observability setup
- **[QUICKSTART_CLOUD_NATIVE.md](QUICKSTART_CLOUD_NATIVE.md)** - Quick start guide
- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Configuration reference

## 🆘 Troubleshooting

### Services won't start
```bash
# Check Docker logs
docker-compose -f docker-compose.prod.yml logs
```

### Database connection errors
```bash
# Test connection
docker-compose -f docker-compose.prod.yml exec backend curl postgres:5432
```

### High resource usage
```bash
# Check resource usage
docker stats
```

### Services not responding
```bash
# Health check
docker-compose -f docker-compose.prod.yml ps
```

## 🔐 Security Checklist

- [ ] Change database password
- [ ] Generate strong JWT_SECRET
- [ ] Generate strong SESSION_SECRET
- [ ] Enable HTTPS with valid certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Implement log aggregation
- [ ] Enable monitoring & alerting
- [ ] Regular security audits

## 📞 Support & References

- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 📄 License

ISC

## 👤 Author

Ryan Hanif

---

**Version**: 1.0.0 | **Last Updated**: January 2026

🎉 **Cloud-Native Architecture Ready for Deployment!**
