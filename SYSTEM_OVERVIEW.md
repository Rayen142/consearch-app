# System Overview - ConSearch Application

## Arsitektur Cloud-Native Concert Search Platform

Dokumen ini menjelaskan arsitektur lengkap aplikasi ConSearch, termasuk aliran data, komponen sistem, monitoring, dan strategi scaling.

---

## 📊 Diagram Arsitektur

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         End Users                                │
│                    (Web Browser/Mobile)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                          │
│  • SSL/TLS Termination                                          │
│  • Load Balancing                                                │
│  • Rate Limiting                                                 │
│  • Static Content Serving                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Express)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Layer                                                 │  │
│  │  • Authentication (JWT)                                   │  │
│  │  • Authorization                                          │  │
│  │  • Business Logic                                         │  │
│  │  • Request Validation                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Monitoring Layer (prom-client)                           │  │
│  │  • Metrics Collection                                     │  │
│  │  • Request Duration                                       │  │
│  │  • Business Metrics                                       │  │
│  │  • Resource Metrics                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────┬────────────────────────────────┘
         │                        │
         │ SQL                    │ /metrics
         ▼                        ▼
┌──────────────────────┐  ┌─────────────────────────────────────┐
│   PostgreSQL         │  │     Prometheus                      │
│  • User Data         │  │  • Metrics Storage                  │
│  • Concert Data      │  │  • Query Engine                     │
│  • Ticket Sales      │  │  • Alert Evaluation                 │
│  • Transactions      │  │  • Time-Series DB                   │
└──────────────────────┘  └────────┬────────────────────────────┘
                                   │
                                   │ Alerts
                                   ▼
                          ┌──────────────────────────────────┐
                          │      Alertmanager                │
                          │  • Alert Routing                 │
                          │  • Notification Management       │
                          │  • Alert Grouping                │
                          │  • Deduplication                 │
                          └────────┬─────────────────────────┘
                                   │
                                   ▼
                          ┌──────────────────────────────────┐
                          │   Notification Channels          │
                          │  • Email (SMTP)                  │
                          │  • Slack                         │
                          │  • PagerDuty                     │
                          │  • Webhook                       │
                          └──────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. User Request Flow

```
┌─────┐     ┌───────┐     ┌────────┐     ┌──────────┐
│User │────▶│ Nginx │────▶│ Node.js│────▶│PostgreSQL│
└─────┘     └───────┘     └────────┘     └──────────┘
  │            │              │                │
  │            │              │                │
  │◀───────────┴──────────────┴────────────────┘
  │         Response with Data
```

**Step-by-step:**

1. **User Request** → HTTPS request ke `https://consearch.example.com/api/concerts`
2. **Nginx** → 
   - SSL/TLS termination
   - Request validation
   - Rate limiting check
   - Forward ke backend: `http://app:3000/api/concerts`
3. **Node.js Backend** →
   - JWT token validation
   - Parse request
   - Execute business logic
   - Query database: `SELECT * FROM concerts WHERE available = true`
   - Collect metrics (request duration, counter, etc.)
4. **PostgreSQL** →
   - Execute query
   - Return result set
5. **Response Path** →
   - Node.js formats response as JSON
   - Nginx forwards response to user
   - User receives data

**Time Budget (Target):**
- Nginx processing: < 5ms
- Node.js processing: < 50ms
- Database query: < 100ms
- Network latency: < 50ms
- **Total P95 Target: < 500ms**

---

### 2. Metrics Collection Flow

```
┌────────────┐    /metrics    ┌───────────┐
│  Node.js   │◀──────────────│Prometheus │
│ (prom-     │   HTTP GET     │           │
│  client)   │                │           │
└────────────┘                └─────┬─────┘
      │                             │
      │ Export metrics              │ Store & Query
      │ - http_request_duration     │
      │ - tickets_sold_total        │
      │ - process_cpu_seconds       │
      └─────────────────────────────┘
                                    │
                                    │ Evaluate rules
                                    ▼
                            ┌───────────────┐
                            │ Alert Rules   │
                            │ (P95 > 500ms) │
                            └───────┬───────┘
                                    │
                                    │ Trigger alert
                                    ▼
                            ┌───────────────┐
                            │ Alertmanager  │
                            └───────┬───────┘
                                    │
                                    │ Route & Notify
                                    ▼
                            ┌───────────────┐
                            │Email/Slack/SMS│
                            └───────────────┘
```

**Prometheus Scraping:**

```yaml
# Prometheus config
scrape_configs:
  - job_name: 'consearch-app'
    scrape_interval: 5s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:3000']
```

**Metrics Exposed:**

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="0.1"} 1500
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="0.5"} 2000
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="1"} 2100
http_request_duration_seconds_sum{method="GET",route="/concerts",code="200"} 250.5
http_request_duration_seconds_count{method="GET",route="/concerts",code="200"} 2100

# HELP tickets_sold_total Total tickets sold
# TYPE tickets_sold_total counter
tickets_sold_total 15432
```

---

### 3. Alert Flow - P95 Latency Notification

**Scenario: P95 latency melebihi 500ms**

```
┌────────────────────────────────────────────────────────────────┐
│ Step 1: Prometheus Evaluates Alert Rules                       │
│                                                                 │
│ Rule:                                                           │
│ histogram_quantile(0.95,                                       │
│   rate(http_request_duration_seconds_bucket[5m])) > 0.5       │
│                                                                 │
│ Result: TRUE for 2 minutes → Trigger Alert                    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 2: Prometheus Sends Alert to Alertmanager                 │
│                                                                 │
│ Alert Payload:                                                  │
│ {                                                               │
│   "alertname": "HighP95Latency",                               │
│   "severity": "warning",                                        │
│   "service": "backend",                                         │
│   "instance": "app:3000",                                      │
│   "value": "0.65",                                             │
│   "description": "P95 latency is 650ms (threshold: 500ms)"    │
│ }                                                               │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 3: Alertmanager Routes Alert                              │
│                                                                 │
│ Routing Logic:                                                  │
│ - Match: alert_type=performance → performance-alerts receiver  │
│ - Group by: alertname, service, severity                       │
│ - Group wait: 1 minute (collect similar alerts)               │
│ - Inhibit: Check for higher priority alerts                   │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 4: Send Notifications                                      │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Email to: performance-team@consearch.com                 │  │
│ │ Subject: 📊 Performance Alert: HighP95Latency            │  │
│ │                                                           │  │
│ │ Performance Degradation Detected                         │  │
│ │ ----------------------------------------                 │  │
│ │ Issue: High P95 latency detected on app:3000            │  │
│ │ Details: P95 latency is 650ms (threshold: 500ms)        │  │
│ │ Metric Value: 0.65s                                      │  │
│ │                                                           │  │
│ │ Recommended Actions:                                      │  │
│ │ • Check application logs                                 │  │
│ │ • Review recent deployments                              │  │
│ │ • Check database query performance                       │  │
│ │ • Monitor resource usage (CPU, Memory)                   │  │
│ │ • Consider horizontal scaling                            │  │
│ │                                                           │  │
│ │ Dashboard: http://grafana:3000/d/app-performance        │  │
│ │ Runbook: https://wiki.example.com/runbooks/high-latency │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Slack to: #performance                                   │  │
│ │                                                           │  │
│ │ 📊 HighP95Latency                                        │  │
│ │ Performance Issue Detected                               │  │
│ │ P95 latency is 650ms (threshold: 500ms)                 │  │
│ │ Current Value: 0.65s                                     │  │
│ │ Dashboard: http://grafana:3000/d/app-performance        │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Alert Lifecycle:**

1. **FIRING** (0-2 min): Prometheus detects condition is true
2. **PENDING** (2 min): Wait for `for: 2m` duration
3. **TRIGGERED**: Send to Alertmanager
4. **GROUPED** (1 min): Alertmanager groups similar alerts
5. **ROUTED**: Forward to appropriate receiver
6. **NOTIFIED**: Send email, Slack, etc.
7. **RESOLVED**: When condition becomes false, send resolution notification

**Notification Frequency:**
- Initial notification: Immediate after grouping
- Repeat interval: Every 1 hour if still firing
- Resolution: Sent when P95 latency < 500ms for 2 minutes

---

## 🏗️ Component Details

### Backend (Node.js + Express)

**Responsibilities:**
- API endpoints (REST)
- Authentication & Authorization (JWT)
- Business logic
- Database operations
- Metrics exposition

**Key Files:**
- [`app.js`](app.js) - Main application
- [`package.json`](package.json) - Dependencies

**Metrics Exposed:**
```javascript
// Custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1]
});

const ticketSoldCounter = new client.Counter({
    name: 'tickets_sold_total',
    help: 'Total tickets sold'
});

// Default metrics (from prom-client)
// - process_cpu_seconds_total
// - process_resident_memory_bytes
// - nodejs_eventloop_lag_seconds
// - nodejs_heap_size_total_bytes
```

**Health Endpoints:**
- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

---

### Database (PostgreSQL)

**Responsibilities:**
- Data persistence
- ACID transactions
- Query optimization

**Schema:**
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Concerts table
CREATE TABLE concerts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    date TIMESTAMP NOT NULL,
    venue VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_tickets INTEGER NOT NULL
);

-- Purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    concert_id INTEGER REFERENCES concerts(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT NOW()
);
```

**Connection Pool:**
```javascript
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,                    // Max connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000 // Connection timeout
});
```

---

### Monitoring (Prometheus + Alertmanager)

**Prometheus Configuration:**
- Scrape interval: 5s untuk aplikasi, 10s untuk infrastructure
- Retention: 15 days (default)
- Storage: Local disk atau remote storage (Thanos/Cortex)

**Alert Rules:**
- [`alert.rules.yml`](alert.rules.yml) - Alert definitions
  - Latency alerts (P95, P99, average)
  - Error rate alerts
  - Resource alerts (CPU, memory)
  - Database alerts
  - Business metrics alerts

**Alertmanager Configuration:**
- [`alertmanager.yml`](alertmanager/alertmanager.yml)
  - Multiple receivers (email, Slack, PagerDuty)
  - Routing by severity and alert type
  - Grouping and deduplication
  - Inhibit rules

---

### Reverse Proxy (Nginx)

**Responsibilities:**
- SSL/TLS termination
- Load balancing
- Rate limiting
- Static file serving
- Request routing

**Configuration highlights:**
```nginx
upstream backend {
    least_conn;  # Load balancing algorithm
    server app:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen 443 ssl http2;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Proxy to backend
    location / {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🚀 Kubernetes Deployment

### Scaling Strategy

**Horizontal Pod Autoscaler (HPA):**

```yaml
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Scaling Behavior:**
- **Scale Up**: Aggressive (100% per 15s, max 4 pods)
- **Scale Down**: Conservative (50% per 60s, wait 5 min)

**Files:**
- [`deployment.yaml`](k8s/deployment.yaml) - Deployment configuration
- [`service.yaml`](k8s/service.yaml) - Service & Ingress
- [`hpa.yaml`](k8s/hpa.yaml) - Autoscaling configuration

---

## 🔍 Load Testing

**k6 Load Test:**
- [`loadtest.js`](loadtest.js) - Load test script

**Test Scenario:**
1. Warm-up: 10 users (30s)
2. **Spike: 10 → 100 users (1 min)**
3. Sustain: 100 users (3 min)
4. Ramp down: 100 → 50 → 0

**Success Criteria:**
- P95 latency < 500ms
- Error rate < 5%
- No pod crashes
- HPA scales appropriately

**Run Test:**
```bash
k6 run loadtest.js
```

---

## 📈 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| P50 Latency | < 100ms | < 200ms |
| P95 Latency | < 500ms | < 1s |
| P99 Latency | < 1s | < 2s |
| Error Rate | < 1% | < 5% |
| Availability | > 99.9% | > 99% |
| CPU Usage | < 70% | < 90% |
| Memory Usage | < 80% | < 95% |

---

## 🔐 Security

**Authentication:**
- JWT tokens with expiration
- Bcrypt password hashing (10 rounds)
- Session management

**Network Security:**
- TLS 1.2+ only
- Network policies in Kubernetes
- Rate limiting

**Secret Management:**
- Kubernetes Secrets for sensitive data
- Environment variables for configuration

---

## 📚 Related Documentation

- [Architecture Summary](ARCHITECTURE_SUMMARY.md) - This document
- [Monitoring Guide](MONITORING_GUIDE.md) - Detailed monitoring setup
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Deployment procedures
- [Quick Start](QUICKSTART.md) - Getting started guide

---

## 🆘 Troubleshooting

### High Latency
1. Check Grafana dashboard for P95 latency
2. Review application logs: `kubectl logs -n consearch -l component=backend`
3. Check database performance: `SELECT * FROM pg_stat_statements`
4. Verify HPA is scaling: `kubectl get hpa -n consearch`

### Service Down
1. Check pod status: `kubectl get pods -n consearch`
2. View recent events: `kubectl get events -n consearch --sort-by='.lastTimestamp'`
3. Check logs: `kubectl logs -n consearch <pod-name> --previous`
4. Verify service endpoints: `kubectl get endpoints -n consearch`

### Database Issues
1. Check PostgreSQL logs
2. Monitor connection pool usage
3. Review slow queries
4. Check disk space

---

**Last Updated:** January 2026
**Version:** 1.0
**Maintained by:** DevOps Team
