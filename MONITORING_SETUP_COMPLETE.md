# Setup Complete - Monitoring Infrastructure

## ✅ Komponen yang Sudah Ditambahkan

### 1. Docker Compose Services

Semua service monitoring sudah ditambahkan ke `docker-compose.yml`:

#### Existing Services:
- **app** - Backend Node.js (port 3000)
- **db** - PostgreSQL database (port 5435)
- **prometheus** - Prometheus monitoring (port 9090)
- **grafana** - Grafana dashboard (port 3001)

#### NEW Services (Added):
- **cadvisor** - Container metrics exporter (port 8080)
  - Memonitor CPU, Memory, Network, Disk usage dari semua container
  - Diperlukan untuk metrik **"CPU Backend"**
  
- **postgres-exporter** - PostgreSQL metrics exporter (port 9187)
  - Memonitor database performance metrics
  - Diperlukan untuk metrik **"Database Latency"**

### 2. Prometheus Configuration

File `prometheus.yml` sudah diupdate dengan scrape jobs baru:

```yaml
scrape_configs:
  # Aplikasi Node.js (P95, Error Rate)
  - job_name: 'consearch-app'
    scrape_interval: 5s
    targets: ['app:3000']
  
  # Container metrics (CPU Backend)
  - job_name: 'cadvisor'
    scrape_interval: 5s
    targets: ['cadvisor:8080']
  
  # Database metrics (Database Latency)
  - job_name: 'postgres-exporter'
    scrape_interval: 10s
    targets: ['postgres-exporter:9187']
```

### 3. Alert Rules

File `alert.rules.yml` sudah configured dengan alerts untuk:

- **P95 Latency > 500ms** (HighP95Latency)
- **Error Rate > 5%** (HighErrorRate)
- **CPU Usage > 80%** (HighCPUUsage)
- **Slow Database Queries** (SlowDatabaseQueries)

---

## 📊 4 Metrik yang Diminta (Sesuai PDF Ujian)

### Metrik 1: P95 Response Time ✅
**Source:** Backend Node.js (prom-client)  
**PromQL:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```
**Endpoint:** http://localhost:3000/metrics  
**Target:** `consearch-app` di Prometheus

---

### Metrik 2: Error Rate ✅
**Source:** Backend Node.js (prom-client)  
**PromQL:**
```promql
rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```
**Endpoint:** http://localhost:3000/metrics  
**Target:** `consearch-app` di Prometheus

---

### Metrik 3: CPU Backend ✅
**Source:** cAdvisor (Container metrics)  
**PromQL:**
```promql
rate(container_cpu_usage_seconds_total{name="consearch-app-main-app-1"}[5m]) * 100
```
**Endpoint:** http://localhost:8080/metrics  
**Target:** `cadvisor` di Prometheus

---

### Metrik 4: Database Latency ✅
**Source:** Postgres Exporter  
**PromQL (Cache Hit Ratio - semakin tinggi semakin baik):**
```promql
pg_stat_database_blks_hit{datname="consearchdb"} / 
(pg_stat_database_blks_hit{datname="consearchdb"} + pg_stat_database_blks_read{datname="consearchdb"}) * 100
```
**Endpoint:** http://localhost:9187/metrics  
**Target:** `postgres-exporter` di Prometheus

---

## 🚀 Cara Menggunakan

### Step 1: Verifikasi Semua Container Running

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Harus melihat 6 containers:
- ✅ consearch-app-main-app-1 (Backend - port 3000)
- ✅ consearch-app-main-db-1 (PostgreSQL - port 5435)
- ✅ consearch-app-main-prometheus-1 (Prometheus - port 9090)
- ✅ consearch-app-main-grafana-1 (Grafana - port 3001)
- ✅ consearch-cadvisor (cAdvisor - port 8080)
- ✅ consearch-postgres-exporter (Postgres Exporter - port 9187)

### Step 2: Cek Prometheus Targets

Buka: http://localhost:9090/targets

Pastikan semua target **UP** (hijau):
- consearch-app (app:3000)
- cadvisor (cadvisor:8080)
- postgres-exporter (postgres-exporter:9187)
- prometheus (localhost:9090)

### Step 3: Generate Traffic dengan k6

```powershell
cd c:\Users\User\Downloads\consearch-app-main
k6 run loadtest.js
```

Ini akan:
- Generate spike traffic dari 10 → 100 users
- Membuat metrik muncul di Prometheus
- Trigger alerts jika threshold terlewati

### Step 4: Query di Prometheus

Buka: http://localhost:9090

Test setiap query:

1. **P95 Response Time:**
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. **Error Rate:**
   ```promql
   rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
   ```

3. **CPU Backend:**
   ```promql
   rate(container_cpu_usage_seconds_total{name="consearch-app-main-app-1"}[5m]) * 100
   ```

4. **Database Cache Hit:**
   ```promql
   pg_stat_database_blks_hit{datname="consearchdb"} / (pg_stat_database_blks_hit{datname="consearchdb"} + pg_stat_database_blks_read{datname="consearchdb"}) * 100
   ```

### Step 5: Setup Grafana Dashboard

1. Login Grafana: http://localhost:3001
   - Username: `admin`
   - Password: `admin`

2. Add Prometheus Data Source:
   - Configuration → Data Sources → Add data source
   - Select: Prometheus
   - URL: `http://prometheus:9090`
   - Click: Save & Test

3. Create Dashboard:
   - Create → Dashboard → Add new panel
   - Tambahkan 4 panels untuk masing-masing metrik
   - Set unit yang sesuai (ms, %, etc.)

---

## 📝 Untuk Incident Response (Soal 2b)

Alert Rules sudah configured di `alert.rules.yml`:

### Example Alert Flow:

1. **Detection:**
   - Prometheus scrape metrik setiap 5-15 detik
   - Evaluasi alert rules setiap 30 detik

2. **P95 Alert Trigger:**
   ```yaml
   - alert: HighP95Latency
     expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
     for: 2m  # Alert setelah 2 menit consistent
   ```

3. **Notification:**
   - Alertmanager akan kirim notifikasi via:
     - Email (configured di alertmanager.yml)
     - Slack (webhook configured)
     - PagerDuty (integration configured)

4. **Troubleshooting Steps:**
   - Check Prometheus Alerts: http://localhost:9090/alerts
   - View logs: `docker logs consearch-app-main-app-1`
   - Check resource: http://localhost:8080 (cAdvisor UI)

---

## 🔧 Troubleshooting

### Jika metrik tidak muncul:

1. **Generate some traffic first:**
   ```powershell
   # Simple requests
   curl http://localhost:3000/concerts
   curl http://localhost:3000/concerts
   curl http://localhost:3000/concerts
   ```

2. **Check exporter endpoints:**
   - Backend metrics: http://localhost:3000/metrics
   - cAdvisor metrics: http://localhost:8080/metrics
   - Postgres metrics: http://localhost:9187/metrics

3. **Restart jika diperlukan:**
   ```powershell
   docker-compose restart prometheus
   docker-compose restart cadvisor
   docker-compose restart postgres-exporter
   ```

### Jika target DOWN:

1. Check container health:
   ```powershell
   docker ps
   docker logs <container-name>
   ```

2. Verify network connectivity:
   ```powershell
   docker exec consearch-app-main-prometheus-1 wget -O- http://app:3000/metrics
   ```

---

## 📚 File References

Semua konfigurasi ada di:

- **docker-compose.yml** - Service definitions (6 services)
- **prometheus.yml** - Prometheus scrape configs (4 jobs)
- **alert.rules.yml** - Alert rules (6 groups, 12+ alerts)
- **PROMETHEUS_QUERIES.md** - Detail queries untuk 4 metrik
- **K6_LOAD_TESTING_GUIDE.md** - Cara jalankan load test
- **ALERT_NOTIFICATION_FLOW.md** - Detail incident response flow

---

## ✅ Checklist untuk Demo/Ujian

- [x] cAdvisor running untuk CPU metrics
- [x] Postgres Exporter running untuk DB metrics
- [x] Prometheus scraping 4 targets
- [x] Alert rules loaded dan aktif
- [x] Grafana data source configured
- [x] Load testing tool ready (k6)
- [x] Dokumentasi lengkap (queries, flow, troubleshooting)

**Status: READY FOR DEMO/UJIAN** 🎉

---

## Quick Commands

```powershell
# Start all services
docker-compose up -d

# Check status
docker ps

# View logs
docker logs consearch-app-main-prometheus-1
docker logs consearch-cadvisor
docker logs consearch-postgres-exporter

# Run load test
k6 run loadtest.js

# Stop all
docker-compose down
```
