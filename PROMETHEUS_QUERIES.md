# Prometheus Queries untuk 4 Metrik Utama

Dokumen ini berisi query PromQL yang diperlukan untuk mengambil 4 metrik yang diminta dalam ujian:

## 1. P95 Response Time (Latency)

Query untuk mendapatkan P95 response time dari aplikasi backend:

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Penjelasan:**
- `histogram_quantile(0.95, ...)` - Menghitung persentil ke-95 (P95)
- `rate(...[5m])` - Menghitung rate dalam 5 menit terakhir
- `http_request_duration_seconds_bucket` - Histogram bucket dari durasi request

**Cara Testing di Prometheus:**
1. Buka http://localhost:9090
2. Paste query di atas ke query box
3. Click "Execute"
4. Lihat grafik response time P95

**Alert Rule:** Alert akan trigger jika P95 > 500ms selama 2 menit (sudah dikonfigurasi di alert.rules.yml)

---

## 2. Error Rate

Query untuk mendapatkan error rate (5xx errors):

```promql
rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

**Penjelasan:**
- `http_requests_total{code=~"5.."}` - Total request dengan status code 5xx
- `rate(...[5m])` - Rate dalam 5 menit terakhir
- `* 100` - Konversi ke persentase

**Cara Testing:**
1. Generate error dengan load test: `k6 run loadtest.js`
2. Buka Prometheus: http://localhost:9090
3. Jalankan query di atas
4. Error rate normal: < 5%

**Alert Rule:** Alert akan trigger jika error rate > 5% selama 2 menit

---

## 3. CPU Backend (Container CPU Usage)

Query untuk mendapatkan CPU usage dari container backend menggunakan cAdvisor:

```promql
rate(container_cpu_usage_seconds_total{name="consearch-app-main-app-1"}[5m]) * 100
```

**Atau query yang lebih komprehensif:**

```promql
sum(rate(container_cpu_usage_seconds_total{container_label_com_docker_compose_service="app"}[5m])) by (name) * 100
```

**Penjelasan:**
- `container_cpu_usage_seconds_total` - Total CPU seconds dari cAdvisor
- `name="consearch-app-main-app-1"` - Filter untuk container backend
- `rate(...[5m])` - Rate CPU usage dalam 5 menit
- `* 100` - Konversi ke persentase

**Cara Testing:**
1. Pastikan cAdvisor running: http://localhost:8080
2. Buka Prometheus: http://localhost:9090
3. Jalankan query
4. Normal usage: 10-30%, High load: 50-80%

**Alert Rule:** Alert jika CPU > 80% selama 5 menit

---

## 4. Database Latency

Query untuk mendapatkan latency database PostgreSQL menggunakan Postgres Exporter:

```promql
rate(pg_stat_database_tup_returned{datname="consearchdb"}[5m]) / rate(pg_stat_database_xact_commit{datname="consearchdb"}[5m])
```

**Atau untuk query duration average:**

```promql
avg(pg_stat_statements_mean_exec_time_seconds{datname="consearchdb"}) * 1000
```

**Query alternatif (lebih sederhana):**

```promql
pg_stat_database_blks_hit{datname="consearchdb"} / (pg_stat_database_blks_hit{datname="consearchdb"} + pg_stat_database_blks_read{datname="consearchdb"}) * 100
```
*Query ini menghitung cache hit ratio - semakin tinggi (mendekati 100%) semakin baik*

**Penjelasan:**
- `pg_stat_database_*` - Metrik dari PostgreSQL exporter
- `datname="consearchdb"` - Filter untuk database consearchdb
- Metrik mencakup: query commits, tuple returns, cache hits

**Cara Testing:**
1. Postgres Exporter: http://localhost:9187/metrics
2. Prometheus: http://localhost:9090
3. Jalankan query
4. Normal latency: < 100ms

**Alert Rule:** Alert jika average query duration > 100ms selama 5 menit

---

## Testing Lengkap Semua Metrik

### Step 1: Jalankan Load Test
```bash
cd c:\Users\User\Downloads\consearch-app-main
k6 run loadtest.js
```

### Step 2: Buka Prometheus
http://localhost:9090

### Step 3: Query Setiap Metrik

**Panel 1 - P95 Response Time:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Panel 2 - Error Rate:**
```promql
rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

**Panel 3 - CPU Backend:**
```promql
rate(container_cpu_usage_seconds_total{name="consearch-app-main-app-1"}[5m]) * 100
```

**Panel 4 - Database Cache Hit Ratio:**
```promql
pg_stat_database_blks_hit{datname="consearchdb"} / (pg_stat_database_blks_hit{datname="consearchdb"} + pg_stat_database_blks_read{datname="consearchdb"}) * 100
```

### Step 4: Verifikasi di Grafana

1. Login ke Grafana: http://localhost:3001 (admin/admin)
2. Tambahkan Prometheus sebagai Data Source:
   - Configuration > Data Sources > Add data source
   - Pilih Prometheus
   - URL: `http://prometheus:9090`
   - Click "Save & Test"

3. Create Dashboard baru:
   - Create > Dashboard > Add new panel
   - Masukkan query PromQL untuk masing-masing metrik
   - Set unit yang sesuai (milliseconds, percentage, etc.)

---

## Verifikasi Alert Rules

Untuk memastikan alert rules sudah loaded:

1. Buka Prometheus: http://localhost:9090
2. Navigate ke: Status > Rules
3. Anda akan melihat semua alert groups:
   - latency_alerts (HighP95Latency, CriticalP99Latency)
   - error_rate_alerts (HighErrorRate, ServerErrors)
   - resource_alerts (HighCPUUsage, HighMemoryUsage)
   - database_alerts (SlowDatabaseQueries)

4. Navigate ke: Alerts
5. Lihat status setiap alert (Inactive = OK, Pending = Evaluating, Firing = Alert aktif)

---

## Troubleshooting

### Jika metrik tidak muncul:

**1. Cek target Prometheus:**
- http://localhost:9090/targets
- Pastikan semua target UP (berwarna hijau):
  - consearch-app (app:3000)
  - cadvisor (cadvisor:8080)
  - postgres-exporter (postgres-exporter:9187)

**2. Cek exporter metrics:**
- cAdvisor: http://localhost:8080/metrics
- Postgres Exporter: http://localhost:9187/metrics
- Backend: http://localhost:3000/metrics

**3. Generate traffic:**
```bash
# Generate beberapa request untuk membuat metrik muncul
curl http://localhost:3000/concerts
curl http://localhost:3000/concerts
curl http://localhost:3000/concerts
```

**4. Restart containers jika diperlukan:**
```bash
docker-compose restart prometheus
docker-compose restart cadvisor
docker-compose restart postgres-exporter
```

---

## Summary

✅ **P95 Response Time**: Dari histogram http_request_duration_seconds
✅ **Error Rate**: Dari counter http_requests_total dengan code 5xx
✅ **CPU Backend**: Dari cAdvisor container_cpu_usage_seconds_total
✅ **Database Latency**: Dari Postgres Exporter pg_stat_database metrics

Semua metrik ini sudah dikonfigurasi dengan:
- Alert rules di alert.rules.yml
- Scrape configs di prometheus.yml
- Exporters di docker-compose.yml (cAdvisor, postgres-exporter)
