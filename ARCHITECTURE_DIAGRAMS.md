# 🏗️ Cloud-Native Consearch Architecture - Diagram & Visual Reference

## 📊 System Architecture Diagram

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                     END USERS (Web Browsers)                                ║
║                                                                              ║
║  User A                User B                User C                          ║
║    │                     │                     │                            ║
└─────┼─────────────────────┼─────────────────────┼────────────────────────────┘
      │                     │                     │
      │                 HTTP/HTTPS                │
      └─────────────────────┼─────────────────────┘
                            │
        ╔───────────────────▼────────────────────╗
        │   CLOUD PROVIDER / ON-PREMISE         │
        │   (AWS, GCP, Azure, or Local)         │
        │                                        │
        │  ╔──────────────────────────────────╗ │
        │  │  LOAD BALANCER / INGRESS         │ │
        │  │  (AWS ALB / K8s Ingress)         │ │
        │  │  - Port 80, 443                  │ │
        │  │  - SSL/TLS Termination          │ │
        │  │  - DDoS Protection               │ │
        │  └──────────────┬───────────────────┘ │
        │                 │                      │
        │  ╔──────────────▼──────────────────╗  │
        │  │   KUBERNETES CLUSTER            │  │
        │  │                                  │  │
        │  │  Namespace: consearch            │  │
        │  │                                  │  │
        │  │  ┌─────────────────────────────┐ │  │
        │  │  │  Frontend Pod               │ │  │
        │  │  │  (Nginx × 2)                │ │  │
        │  │  │  - Port 8080                │ │  │
        │  │  │  - Static files             │ │  │
        │  │  │  - Reverse proxy            │ │  │
        │  │  │  - Load balancer            │ │  │
        │  │  └────────────┬────────────────┘ │  │
        │  │               │                   │  │
        │  │  ┌────────────▼────────────────┐  │  │
        │  │  │  Backend Pods               │  │  │
        │  │  │  (Node.js × 2-5)            │  │  │
        │  │  │  - Port 3000                │  │  │
        │  │  │  - REST API                 │  │  │
        │  │  │  - HPA: 2-5 replicas        │  │  │
        │  │  │  - Health checks            │  │  │
        │  │  │  - Prometheus metrics       │  │  │
        │  │  └────────────┬────────────────┘  │  │
        │  │               │                   │  │
        │  │  ┌────────────▼────────────────┐  │  │
        │  │  │  Database Pod               │  │  │
        │  │  │  (PostgreSQL × 1)           │  │  │
        │  │  │  - Port 5432                │  │  │
        │  │  │  - Persistent Storage 10GB  │  │  │
        │  │  │  - Health checks            │  │  │
        │  │  └─────────────────────────────┘  │  │
        │  │                                  │  │
        │  │  ┌─────────────────────────────┐ │  │
        │  │  │  Monitoring Stack           │ │  │
        │  │  │                             │ │  │
        │  │  │  ┌───────────────────────┐ │ │  │
        │  │  │  │ Prometheus            │ │ │  │
        │  │  │  │ - Port 9090           │ │ │  │
        │  │  │  │ - Metrics collection  │ │ │  │
        │  │  │  │ - 30d retention       │ │ │  │
        │  │  │  └───────────────────────┘ │ │  │
        │  │  │                             │ │  │
        │  │  │  ┌───────────────────────┐ │ │  │
        │  │  │  │ Grafana               │ │ │  │
        │  │  │  │ - Port 3000           │ │ │  │
        │  │  │  │ - Dashboards          │ │ │  │
        │  │  │  │ - Alerts              │ │ │  │
        │  │  │  └───────────────────────┘ │ │  │
        │  │  │                             │ │  │
        │  │  │  ┌───────────────────────┐ │ │  │
        │  │  │  │ AlertManager          │ │ │  │
        │  │  │  │ - Port 9093           │ │ │  │
        │  │  │  │ - Alert routing       │ │ │  │
        │  │  │  │ - Notifications       │ │ │  │
        │  │  │  └───────────────────────┘ │ │  │
        │  │  └─────────────────────────────┘ │  │
        │  │                                  │  │
        │  │  STORAGE:                       │  │
        │  │  - Persistent Volume Claims     │  │
        │  │  - ConfigMaps & Secrets         │  │
        │  │  - Network Policies             │  │
        │  │                                  │  │
        │  └──────────────────────────────────┘  │
        │                                        │
        │  EXTERNAL SERVICES (Optional)         │
        │  - Email (SMTP) - Alerts              │
        │  - Slack/PagerDuty - Notifications    │
        │  - CloudWatch/Datadog - Logs          │
        │                                        │
        └────────────────────────────────────────┘
```

## 🔄 Request Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request (GET /api/tickets)
       ▼
┌──────────────────────────┐
│  Nginx (Reverse Proxy)   │
├──────────────────────────┤
│ - SSL Termination        │
│ - Rate Limiting          │
│ - Request Routing        │
│ - Compression            │
└──────────────┬───────────┘
               │
               ▼
┌──────────────────────────┐
│  Express.js Backend      │
├──────────────────────────┤
│ - Route Matching         │
│ - Middleware Processing  │
│ - Business Logic         │
│ - Database Query         │
└──────────────┬───────────┘
               │
               ▼
┌──────────────────────────┐
│  PostgreSQL Database     │
├──────────────────────────┤
│ - Query Execution        │
│ - Data Retrieval         │
│ - Transaction Management │
└──────────────┬───────────┘
               │
               ▼
┌──────────────────────────┐
│  Response Generation     │
├──────────────────────────┤
│ - JSON Serialization     │
│ - Headers Set            │
│ - Status Code            │
└──────────────┬───────────┘
               │
               ▼ HTTP Response (JSON)
┌──────────────────────────┐
│  Nginx (Compression)     │
├──────────────────────────┤
│ - Gzip Encoding          │
│ - Caching Headers        │
│ - Response Optimization  │
└──────────────┬───────────┘
               │
               ▼ Compressed Response
┌─────────────┐
│   Browser   │
└─────────────┘

┌─────────────────────────────────────────────────────┐
│           PARALLEL: METRICS COLLECTION              │
├─────────────────────────────────────────────────────┤
│ Request Start                                       │
│ ▼                                                   │
│ Prometheus Middleware                              │
│ ▼                                                   │
│ httpRequestDuration (histogram) ++                  │
│ httpRequests (counter) ++                           │
│ ▼                                                   │
│ Metrics Endpoint (/metrics) - scrapeable by Prometheus
└─────────────────────────────────────────────────────┘
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: NETWORK                         │
├─────────────────────────────────────────────────────────────┤
│ - Firewall (Cloud provider)                                 │
│ - DDoS Protection (WAF)                                     │
│ - VPC / Network Isolation                                   │
│ - Network Policies (Kubernetes)                             │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: TLS/SSL                         │
├─────────────────────────────────────────────────────────────┤
│ - HTTPS (TLS 1.2+)                                          │
│ - Certificate Management (Let's Encrypt)                    │
│ - HSTS Headers                                              │
│ - SSL Pinning (optional)                                    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 3: APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│ - Rate Limiting (API endpoints)                             │
│ - CORS Validation                                           │
│ - Input Validation & Sanitization                           │
│ - SQL Injection Prevention (Prepared Statements)            │
│ - XSS Prevention (Headers, Content-Security-Policy)         │
│ - CSRF Protection (Tokens)                                  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                LAYER 4: AUTHENTICATION                      │
├─────────────────────────────────────────────────────────────┤
│ - JWT Token Validation                                      │
│ - Session Management                                        │
│ - Password Hashing (bcryptjs)                               │
│ - OAuth2 / Social Login (optional)                          │
│ - 2FA / MFA (optional)                                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 5: AUTHORIZATION                      │
├─────────────────────────────────────────────────────────────┤
│ - RBAC (Role-Based Access Control)                          │
│ - ABAC (Attribute-Based Access Control)                     │
│ - Resource-level permissions                                │
│ - Audit Logging                                             │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 6: DATA                              │
├─────────────────────────────────────────────────────────────┤
│ - Encryption at Rest (database)                             │
│ - Encryption in Transit                                     │
│ - Data Masking (PII)                                        │
│ - Backups (encrypted)                                       │
│ - Database Firewalls                                        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               LAYER 7: INFRASTRUCTURE                       │
├─────────────────────────────────────────────────────────────┤
│ - RBAC (Kubernetes)                                         │
│ - Service Accounts                                          │
│ - Pod Security Policies                                     │
│ - Network Policies                                          │
│ - Resource Quotas & Limits                                  │
│ - Security Scanning (Container images)                      │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Monitoring & Metrics Flow

```
┌──────────────────┐
│  Backend Pod     │
│  (App Server)    │
│                  │
│ Prometheus Client
│ - http_requests  │
│ - latency        │
│ - errors         │
│ - business metric│
└────────┬─────────┘
         │
         │ /metrics (HTTP GET)
         │ (every 15s)
         │
         ▼
┌──────────────────────┐
│  Prometheus Server   │
│                      │
│ - Scrapes metrics    │
│ - Stores time-series │
│ - Evaluates rules    │
│ - Fires alerts       │
└────────┬─────────────┘
         │
         ├─────────────┬──────────────┐
         │             │              │
         ▼             ▼              ▼
    ┌────────┐    ┌────────┐    ┌──────────┐
    │ Grafana│    │Alertmgr│    │ Queryable│
    │        │    │        │    │ Database │
    │Dashbds│    │Routes  │    │ PromQL   │
    │        │    │Notifies│    │          │
    └────┬───┘    └────┬───┘    └──────────┘
         │             │
         │             ├─────────────────┐
         │             │                 │
         ▼             ▼                 ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ Users  │    │ Email    │    │ Slack    │
    │(Dashbds    │ SMTP     │    │ Webhook  │
    └────────┘    └──────────┘    └──────────┘
```

## 🔄 Deployment Pipeline

```
┌──────────────┐
│  Code Commit │
│ (Git Push)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ GitHub Actions / CI  │
├──────────────────────┤
│ 1. Build (Docker)    │
│ 2. Test (npm test)   │
│ 3. Security Scan     │
│ 4. Push Registry     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Docker Registry      │
│ (Docker Hub / ACR)   │
└──────┬───────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Dev Env  │  │ Staging  │  │ Production   │
│Docker Cmp│  │Kubernetes│  │Kubernetes    │
│(Local)   │  │(Test)    │  │(Live)        │
└──────────┘  └──────────┘  └──────────────┘

Pull-Based Deployment:
- ArgoCD / Flux monitors Git repo
- Automatically deploys changes
- GitOps workflow
- Rollback capability
```

## 🎯 Scaling Strategy

```
                    CPU UTILIZATION (70%)
                            │
                            ▼
                    ┌─────────────────┐
                    │ HPA Triggered   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Scale Decision  │
                    │ (Min: 2, Max: 5)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌────────┐          ┌────────┐         ┌────────┐
    │ Pod 1  │          │ Pod 2  │         │ Pod 3  │
    │ 3000ms │          │ 3000ms │         │ 3000ms │
    │ Running│          │Running │         │Pending │
    └────────┘          └────────┘         └────────┘
    
    35 req/s            35 req/s            30 req/s
    ═══════════════════════════════════════════════
    Total: 100 req/s (from 70 req/s with 2 pods)
    
    Load reduced: 100/3 = 33.3 req/s per pod
    CPU → ~40% (below 70% threshold)
    ✓ Scaling successful!
```

## 💾 Data Flow Diagram

```
┌─────────────────────┐
│ Nginx (Cache: 24h)  │
│ - Static files      │
│ - Compressed        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────┐
│ Express.js App Tier     │
├─────────────────────────┤
│ - JWT Validation        │
│ - Business Logic        │
│ - Session Management    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Connection Pool (10)    │
│ - TCP Connections       │
│ - Reusable              │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ PostgreSQL Database     │
├─────────────────────────┤
│ Users Table             │
│ Tickets Table           │
│ Audit Logs Table        │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│ Backup Storage          │
│ (S3 / NAS)              │
│ - Daily backups         │
│ - 30-day retention      │
└─────────────────────────┘
```

## 🚦 Health Check Status Indicators

```
HEALTHY STATE (Green ✓)
├─ Backend: /health → 200 OK
├─ Database: pg_isready → OK
├─ Nginx: ← HTTP 200
├─ Prometheus: /-/healthy → OK
├─ Grafana: /api/health → 200
└─ All pods: Running, Ready

DEGRADED STATE (Yellow ⚠)
├─ Backend: High latency (>500ms)
├─ Database: Slow queries
├─ Memory: 70-80% usage
├─ CPU: 60-70% usage
├─ Replica lag: >5s

UNHEALTHY STATE (Red ✗)
├─ Backend: No response
├─ Database: Connection refused
├─ Postgres: Not ready
├─ Out of memory
├─ Crashed pods
```

---

**Version**: 1.0.0 | **Last Updated**: January 2026
