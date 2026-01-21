# Notification System - P95 Latency Alert Flow

## 📊 Overview

Dokumen ini menjelaskan secara detail bagaimana sistem memberikan notifikasi ketika P95 latency melewati ambang batas 500ms.

---

## 🔄 Complete Alert Flow

### Step 1: Metrics Collection (Continuous)

```
┌──────────────────────────────────────────────────────────────┐
│ Node.js Application (prom-client)                            │
│                                                               │
│ const httpRequestDuration = new client.Histogram({           │
│   name: 'http_request_duration_seconds',                     │
│   help: 'Duration of HTTP requests in seconds',              │
│   labelNames: ['method', 'route', 'code'],                   │
│   buckets: [0.1, 0.5, 1]                                     │
│ });                                                           │
│                                                               │
│ // Middleware untuk track setiap request                     │
│ app.use((req, res, next) => {                                │
│   const start = Date.now();                                  │
│   res.on('finish', () => {                                   │
│     const duration = (Date.now() - start) / 1000;            │
│     httpRequestDuration                                       │
│       .labels(req.method, req.route, res.statusCode)         │
│       .observe(duration);  // Record duration in histogram    │
│   });                                                         │
│   next();                                                     │
│ });                                                           │
└──────────────────────────────────────────────────────────────┘
```

**Histogram Buckets:**
- `le=0.1`: Requests completed in ≤ 100ms
- `le=0.5`: Requests completed in ≤ 500ms
- `le=1`: Requests completed in ≤ 1000ms
- `le=+Inf`: All requests

**Example Metrics Exported:**
```prometheus
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="0.1"} 1500
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="0.5"} 1900
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="1"} 2000
http_request_duration_seconds_bucket{method="GET",route="/concerts",code="200",le="+Inf"} 2000
http_request_duration_seconds_sum{method="GET",route="/concerts",code="200"} 800
http_request_duration_seconds_count{method="GET",route="/concerts",code="200"} 2000
```

---

### Step 2: Prometheus Scraping (Every 5 seconds)

```
┌──────────────────────────────────────────────────────────────┐
│ Prometheus Server                                             │
│                                                               │
│ # prometheus.yml configuration                               │
│ scrape_configs:                                              │
│   - job_name: 'consearch-app'                                │
│     scrape_interval: 5s    # Scrape setiap 5 detik          │
│     metrics_path: '/metrics'                                 │
│     static_configs:                                          │
│       - targets: ['app:3000']                                │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP GET /metrics
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Node.js /metrics endpoint                                     │
│ Returns all metrics in Prometheus format                     │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ Metrics stored in TSDB
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Prometheus Time-Series Database                               │
│ Stores metrics with timestamps                                │
│                                                               │
│ Time     | Bucket | Count                                     │
│ 10:00:00 | le=0.5 | 1900                                      │
│ 10:00:05 | le=0.5 | 1920                                      │
│ 10:00:10 | le=0.5 | 1930                                      │
│ ...                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

### Step 3: Alert Rule Evaluation (Every 15 seconds)

```
┌──────────────────────────────────────────────────────────────┐
│ Prometheus Alert Evaluation Engine                           │
│                                                               │
│ # alert.rules.yml                                            │
│ - alert: HighP95Latency                                      │
│   expr: |                                                     │
│     histogram_quantile(                                       │
│       0.95,                                                   │
│       rate(http_request_duration_seconds_bucket[5m])         │
│     ) > 0.5                                                   │
│   for: 2m                                                     │
│   labels:                                                     │
│     severity: warning                                         │
│     service: backend                                          │
│   annotations:                                                │
│     summary: "High P95 latency detected"                     │
│     description: "P95 latency is {{ $value }}s (> 500ms)"   │
└──────────────────────────────────────────────────────────────┘
```

**PromQL Query Breakdown:**

1. **`rate(http_request_duration_seconds_bucket[5m])`**
   - Menghitung rate (req/s) untuk setiap bucket dalam 5 menit terakhir
   - Example: bucket `le=0.5` had 1900 requests → rate = 6.33 req/s

2. **`histogram_quantile(0.95, ...)`**
   - Menghitung P95 (95th percentile) dari histogram
   - Interpolates between buckets untuk mendapatkan nilai exact
   - Result: `0.65` (berarti P95 latency = 650ms)

3. **`> 0.5`**
   - Checks if P95 latency > 500ms
   - Result: `true` (650ms > 500ms)

4. **`for: 2m`**
   - Alert hanya fire jika condition true selama 2 menit berturut-turut
   - Prevents false alarms dari temporary spikes

**Example Evaluation:**

```
Time      | P95 Value | Condition | Alert State
10:00:00  | 0.45s     | FALSE     | OK
10:00:15  | 0.52s     | TRUE      | PENDING (0/2m)
10:00:30  | 0.58s     | TRUE      | PENDING (0.5/2m)
10:00:45  | 0.61s     | TRUE      | PENDING (1/2m)
10:01:00  | 0.65s     | TRUE      | PENDING (1.5/2m)
10:01:15  | 0.68s     | TRUE      | PENDING (2/2m)
10:02:15  | 0.70s     | TRUE      | FIRING! ← Alert triggered
```

---

### Step 4: Alert Sent to Alertmanager

```
┌──────────────────────────────────────────────────────────────┐
│ Prometheus → Alertmanager                                     │
│                                                               │
│ POST http://alertmanager:9093/api/v1/alerts                 │
│                                                               │
│ [                                                             │
│   {                                                           │
│     "labels": {                                               │
│       "alertname": "HighP95Latency",                         │
│       "severity": "warning",                                  │
│       "service": "backend",                                   │
│       "alert_type": "performance",                            │
│       "instance": "app:3000"                                  │
│     },                                                        │
│     "annotations": {                                          │
│       "summary": "High P95 latency detected on app:3000",    │
│       "description": "P95 latency is 650ms (threshold: 500ms)│
│         This may indicate performance degradation.",          │
│       "runbook_url": "https://wiki.example.com/runbooks/...", │
│       "dashboard": "http://grafana:3000/d/app-performance"   │
│     },                                                        │
│     "startsAt": "2026-01-21T10:02:15Z",                     │
│     "endsAt": "0001-01-01T00:00:00Z",                       │
│     "generatorURL": "http://prometheus:9090/graph?...",     │
│     "value": "0.65"                                          │
│   }                                                           │
│ ]                                                             │
└──────────────────────────────────────────────────────────────┘
```

---

### Step 5: Alertmanager Processing

```
┌──────────────────────────────────────────────────────────────┐
│ Step 5a: Alert Grouping                                       │
│                                                               │
│ Group alerts by: ['alertname', 'service', 'severity']        │
│                                                               │
│ Group: HighP95Latency/backend/warning                        │
│   - Alert from instance: app:3000 (value: 0.65s)            │
│                                                               │
│ Wait time: group_wait = 1 minute                             │
│ (Collect similar alerts before sending)                      │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5b: Route Matching                                       │
│                                                               │
│ # alertmanager.yml routing                                   │
│ routes:                                                       │
│   - match:                                                    │
│       alert_type: performance                                 │
│     receiver: 'performance-alerts'  ← MATCHED!               │
│     group_wait: 1m                                            │
│     repeat_interval: 1h                                       │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5c: Inhibition Check                                     │
│                                                               │
│ Check inhibit rules:                                          │
│ - Is there a CRITICAL alert for same service? NO             │
│ - Is service down? NO                                         │
│                                                               │
│ Result: Proceed with notification                             │
└──────────────────────────────────────────────────────────────┘
```

---

### Step 6: Send Notifications

#### 6a. Email Notification

```
┌──────────────────────────────────────────────────────────────┐
│ SMTP Server: smtp.gmail.com:587                               │
│ From: alerts@consearch.com                                    │
│ To: performance-team@consearch.com                            │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Subject: 📊 Performance Alert: HighP95Latency            │ │
│ │                                                           │ │
│ │ Performance Degradation Detected                         │ │
│ │ ========================================                 │ │
│ │                                                           │ │
│ │ Alert: HighP95Latency                                    │ │
│ │                                                           │ │
│ │ Issue:                                                    │ │
│ │ High P95 latency detected on app:3000                   │ │
│ │                                                           │ │
│ │ Details:                                                  │ │
│ │ P95 latency is 650ms (threshold: 500ms). This may       │ │
│ │ indicate performance degradation.                        │ │
│ │                                                           │ │
│ │ Metric Value: 0.65s                                      │ │
│ │ Started at: 2026-01-21 10:02:15 UTC                     │ │
│ │                                                           │ │
│ │ Recommended Actions:                                      │ │
│ │ • Check application logs for errors                      │ │
│ │ • Review recent deployments                              │ │
│ │ • Check database query performance                       │ │
│ │ • Monitor resource usage (CPU, Memory)                   │ │
│ │ • Consider horizontal scaling if load is high           │ │
│ │                                                           │ │
│ │ Links:                                                    │ │
│ │ Dashboard: http://grafana:3000/d/app-performance        │ │
│ │ Runbook: https://wiki.example.com/runbooks/high-latency │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### 6b. Slack Notification

```
┌──────────────────────────────────────────────────────────────┐
│ Slack Webhook: https://hooks.slack.com/services/...          │
│ Channel: #performance                                         │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📊 HighP95Latency                                        │ │
│ │ ⚠️ Warning                                               │ │
│ │                                                           │ │
│ │ Performance Issue Detected                               │ │
│ │                                                           │ │
│ │ P95 latency is 650ms (threshold: 500ms) on app:3000    │ │
│ │ Current Value: 0.65s                                     │ │
│ │                                                           │ │
│ │ 📈 Dashboard: http://grafana:3000/d/app-performance     │ │
│ │ 📖 Runbook: View troubleshooting steps                   │ │
│ │                                                           │ │
│ │ @performance-team                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### 6c. Webhook (PagerDuty/OpsGenie)

```json
POST http://pagerduty-webhook:8080/alert
Content-Type: application/json

{
  "routing_key": "your-integration-key",
  "event_action": "trigger",
  "dedup_key": "HighP95Latency-app:3000",
  "payload": {
    "summary": "High P95 latency detected on app:3000",
    "severity": "warning",
    "source": "prometheus",
    "timestamp": "2026-01-21T10:02:15Z",
    "custom_details": {
      "p95_latency": "650ms",
      "threshold": "500ms",
      "service": "backend",
      "instance": "app:3000",
      "dashboard": "http://grafana:3000/d/app-performance"
    }
  }
}
```

---

### Step 7: Notification Lifecycle

#### 7a. Initial Alert (FIRING)

**Time: 10:02:15** - First notification sent

#### 7b. Ongoing Alert (Still FIRING)

**Time: 11:02:15** (1 hour later) - Repeat notification
- Configured by `repeat_interval: 1h`
- Reminds team that issue is still ongoing

#### 7c. Alert Resolution (RESOLVED)

**Scenario:** After scaling or optimization, P95 latency drops to 400ms

```
Time      | P95 Value | Condition | Alert State
11:30:00  | 0.45s     | FALSE     | FIRING (but condition cleared)
11:30:15  | 0.40s     | FALSE     | FIRING (wait for confirmation)
11:32:15  | 0.38s     | FALSE     | RESOLVED! ← Resolution notification
```

**Resolution Email:**
```
Subject: ✅ RESOLVED: HighP95Latency

Performance Issue Resolved
========================================

Alert: HighP95Latency

Status: RESOLVED
Resolved at: 2026-01-21 11:32:15 UTC
Duration: 1 hour 30 minutes

P95 latency has returned to normal levels (< 500ms).
Current value: 380ms

No further action required.
```

---

## 🎯 Key Points

### 1. Multi-Layer Detection
- **Application**: Collects metrics (prom-client)
- **Prometheus**: Scrapes and evaluates
- **Alertmanager**: Routes and notifies

### 2. Threshold Configuration

```yaml
# alert.rules.yml
expr: histogram_quantile(0.95, rate(...[5m])) > 0.5
for: 2m
```

- **Threshold**: 500ms (0.5s)
- **Time window**: 5 minutes (for calculation)
- **Confirmation**: 2 minutes (before firing)

### 3. Notification Channels

| Channel | Speed | Use Case |
|---------|-------|----------|
| Email | ~1 min | Detailed reports |
| Slack | ~5 sec | Real-time team alerts |
| PagerDuty | ~2 sec | On-call escalation |
| Webhook | ~1 sec | Custom integrations |

### 4. Alert Frequency

- **Initial**: After 2 minutes of high latency
- **Repeat**: Every 1 hour while firing
- **Resolution**: Immediately when resolved

---

## 📝 Testing the Alert

### Test Setup

```bash
# 1. Start all services
docker-compose up -d

# 2. Verify metrics are being collected
curl http://localhost:3000/metrics | grep http_request_duration

# 3. Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# 4. Verify alert rule is loaded
curl http://localhost:9090/api/v1/rules | jq
```

### Trigger Alert Manually

```bash
# Generate load to increase latency
k6 run --vus 200 --duration 5m loadtest.js
```

### Monitor Alert State

```bash
# Check Prometheus alerts
curl http://localhost:9090/api/v1/alerts | jq

# Check Alertmanager
curl http://localhost:9093/api/v1/alerts | jq

# Watch alert status
watch -n 5 'curl -s http://localhost:9090/api/v1/alerts | jq ".data.alerts[] | {name:.labels.alertname, state:.state, value:.value}"'
```

### Expected Timeline

```
T+0:00  - Start load test (200 VUs)
T+0:30  - P95 latency reaches 600ms
T+2:30  - Alert enters PENDING state
T+4:30  - Alert enters FIRING state
T+5:30  - First notification sent
T+5:00  - Stop load test
T+7:00  - P95 latency drops to 350ms
T+9:00  - Alert enters RESOLVED state
T+9:01  - Resolution notification sent
```

---

**Last Updated:** January 2026
**Version:** 1.0
