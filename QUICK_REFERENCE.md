# Quick Reference - 4 Metrik Ujian

## 🎯 Copy-Paste Ready PromQL Queries

### 1️⃣ P95 Response Time
```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```
📊 **Normal:** < 500ms  
🚨 **Alert:** > 500ms for 2 minutes

---

### 2️⃣ Error Rate
```
rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```
📊 **Normal:** < 5%  
🚨 **Alert:** > 5% for 2 minutes

---

### 3️⃣ CPU Backend
```
rate(container_cpu_usage_seconds_total{name="consearch-app-main-app-1"}[5m]) * 100
```
📊 **Normal:** 10-30%  
🚨 **Alert:** > 80% for 5 minutes

---

### 4️⃣ Database Cache Hit Ratio
```
pg_stat_database_blks_hit{datname="consearchdb"} / (pg_stat_database_blks_hit{datname="consearchdb"} + pg_stat_database_blks_read{datname="consearchdb"}) * 100
```
📊 **Normal:** > 90%  
🚨 **Alert:** < 80%

---

## 🔗 Quick Links

| Service | URL | Purpose |
|---------|-----|---------|
| Backend App | http://localhost:3000 | Test aplikasi |
| Prometheus | http://localhost:9090 | Query metrics |
| Grafana | http://localhost:3001 | Dashboard |
| cAdvisor | http://localhost:8080 | Container stats |
| Postgres Exporter | http://localhost:9187/metrics | DB metrics raw |

---

## ⚡ Quick Commands

```powershell
# Generate traffic untuk testing
k6 run loadtest.js

# Check semua container
docker ps

# View Prometheus targets
# http://localhost:9090/targets

# View Prometheus alerts
# http://localhost:9090/alerts
```

---

## 📋 Untuk Jawab Soal Ujian

### Soal 2a: Monitoring Implementation
**Jawaban:** Lihat file `MONITORING_SETUP_COMPLETE.md` section "4 Metrik yang Diminta"

### Soal 2b: Incident Response
**Jawaban:** Lihat file `ALERT_NOTIFICATION_FLOW.md` - Detail P95 notification flow

### Soal 3: Autoscaling Strategy
**Jawaban:** Lihat file `k8s/hpa.yaml` - HPA configuration dengan 3-20 pods

### Soal 4: Architecture Diagram
**Jawaban:** Lihat file `SYSTEM_OVERVIEW.md` - ASCII diagrams dan data flow
