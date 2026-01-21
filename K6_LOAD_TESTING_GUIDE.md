# K6 Load Testing Guide

## Instalasi k6

### Windows

```powershell
# Menggunakan Chocolatey
choco install k6

# Atau download binary dari GitHub
# https://github.com/grafana/k6/releases
```

### Linux

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Or using snap
sudo snap install k6
```

### macOS

```bash
brew install k6
```

### Docker

```bash
docker pull grafana/k6:latest
```

---

## Menjalankan Load Test

### Basic Run

```bash
# Run test dengan default settings
k6 run loadtest.js

# Run dengan custom BASE_URL
k6 run -e BASE_URL=http://localhost:3000 loadtest.js

# Run dengan output ke file
k6 run --out json=test-results.json loadtest.js
```

### Advanced Options

```bash
# Run dengan custom VUs dan duration (override script)
k6 run --vus 50 --duration 2m loadtest.js

# Run dengan specific stage
k6 run --stage 30s:10,1m:100,3m:100 loadtest.js

# Run dengan output ke InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 loadtest.js

# Run dengan output ke Prometheus
k6 run --out experimental-prometheus-rw loadtest.js

# Run dengan multiple outputs
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 loadtest.js
```

### Docker Run

```bash
# Basic run dengan Docker
docker run --rm -v ${PWD}:/scripts grafana/k6 run /scripts/loadtest.js

# Dengan network access ke host
docker run --rm --network host -v ${PWD}:/scripts grafana/k6 run -e BASE_URL=http://localhost:3000 /scripts/loadtest.js

# Dengan custom environment
docker run --rm \
  -v ${PWD}:/scripts \
  -e BASE_URL=http://app:3000 \
  grafana/k6 run /scripts/loadtest.js
```

---

## Understanding Test Results

### Metrics Explained

```
✓ http_req_duration..............: avg=245ms   min=50ms  med=200ms max=1.2s p(90)=450ms p(95)=550ms
✓ http_req_failed................: 2.5%        ✓ 50      ✗ 1950
✓ http_reqs......................: 2000        66.67/s
✓ iteration_duration.............: avg=3.2s    min=1.5s  med=3s   max=8s   p(90)=4.5s p(95)=5.2s
✓ iterations.....................: 500         16.67/iter/s
✓ vus............................: 100         min=10    max=100
```

**Key Metrics:**

- **http_req_duration**: Time untuk complete HTTP request (TANPA DNS lookup dan connection time)
  - `p(95)`: 95% of requests completed in this time or less
  - Target: P95 < 500ms
  
- **http_req_failed**: Percentage of failed requests
  - Target: < 5%
  
- **http_reqs**: Total HTTP requests made
  - Requests per second (throughput)
  
- **iteration_duration**: Time untuk complete full user scenario
  - Includes sleep time dan multiple requests
  
- **vus**: Number of Virtual Users active
  - Shows scaling dari min to max

### Custom Metrics (Our Test)

```
✓ login_duration.................: avg=350ms   p(95)=700ms
✓ search_duration................: avg=150ms   p(95)=250ms
✓ purchase_duration..............: avg=500ms   p(95)=900ms
✓ errors.........................: 3.5%
```

---

## Test Scenarios

### Scenario 1: Spike Test (Current)

**Goal**: Test system resilience under sudden load increase

```javascript
stages: [
  { duration: '30s', target: 10 },   // Warm-up
  { duration: '1m', target: 100 },   // Rapid spike
  { duration: '3m', target: 100 },   // Sustain
  { duration: '1m', target: 50 },    // Ramp down
  { duration: '30s', target: 0 },    // Cool down
]
```

**Expected Results:**
- System scales from 3 to 10-15 pods
- P95 latency stays < 500ms
- Error rate < 5%
- No pod crashes

### Scenario 2: Stress Test

Modify `loadtest.js`:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50
    { duration: '5m', target: 50 },    // Stay at 50
    { duration: '2m', target: 100 },   // Ramp to 100
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Push to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
};
```

**Goal**: Find breaking point

### Scenario 3: Soak Test

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up
    { duration: '2h', target: 50 },    // Sustained load
    { duration: '5m', target: 0 },     // Ramp down
  ],
};
```

**Goal**: Find memory leaks and gradual degradation

### Scenario 4: Smoke Test

```javascript
export const options = {
  vus: 1,
  duration: '1m',
};
```

**Goal**: Basic functionality check

---

## Interpreting Results

### ✅ Successful Test

```
✓ All checks passed
✓ P95 latency: 420ms (< 500ms target)
✓ Error rate: 1.2% (< 5% target)
✓ No pod crashes observed
✓ HPA scaled appropriately (3 → 12 pods)
```

**Actions**: None needed, system is healthy

### ⚠️ Warning Signs

```
⚠ P95 latency: 650ms (> 500ms target)
✓ Error rate: 3% (acceptable)
⚠ HPA maxed out at 20 pods
```

**Actions**:
- Investigate slow endpoints
- Consider increasing max replicas
- Optimize database queries

### ❌ Failed Test

```
✗ P95 latency: 2.5s (5x target!)
✗ Error rate: 15% (3x target)
✗ 3 pods crashed (OOMKilled)
✗ Database connection pool exhausted
```

**Actions**:
- Immediate rollback if this is production
- Fix critical issues:
  - Memory leaks
  - Connection pool size
  - Query optimization
- Re-test after fixes

---

## Monitoring During Load Test

### Terminal 1: Run Test

```bash
k6 run loadtest.js
```

### Terminal 2: Monitor Kubernetes

```bash
# Watch HPA scaling
watch -n 2 'kubectl get hpa -n consearch'

# Watch pod count
watch -n 2 'kubectl get pods -n consearch -l component=backend'

# Watch resource usage
watch -n 2 'kubectl top pods -n consearch'
```

### Terminal 3: Monitor Logs

```bash
kubectl logs -n consearch -l component=backend -f | grep -i "error\|warn\|slow"
```

### Browser: Grafana Dashboard

Open: `http://localhost:3000` (Grafana)

Monitor:
- Request rate graph
- Latency percentiles (P50, P95, P99)
- Error rate
- CPU/Memory usage
- Active connections

---

## Analyzing Test Results

### View Summary Report

```bash
k6 run --summary-export=summary.json loadtest.js
cat summary.json | jq
```

### Generate HTML Report

```bash
# Install k6-reporter
npm install -g k6-reporter

# Run test with JSON output
k6 run --out json=results.json loadtest.js

# Generate HTML
k6-reporter results.json
```

### Query Results from InfluxDB

```bash
# If using InfluxDB output
influx -database k6 -execute 'SELECT mean("value") FROM "http_req_duration" WHERE time > now() - 1h GROUP BY time(1m)'
```

---

## Common Issues & Solutions

### Issue 1: Test Fails Immediately

```
WARN[0000] Request Failed error="Get \"http://localhost:3000/concerts\": dial tcp [::1]:3000: connect: connection refused"
```

**Solution:**
```bash
# Check if app is running
curl http://localhost:3000/health

# Update BASE_URL
k6 run -e BASE_URL=http://localhost:3000 loadtest.js
```

### Issue 2: Authentication Failures

```
✗ login status is 200
  ↳  45% — ✓ 900 / ✗ 1100
```

**Solution:**
- Check default user exists in database
- Verify JWT_SECRET is set correctly
- Check password hashing is working

### Issue 3: Too Many Errors

```
✗ http_req_failed................: 25%
```

**Solution:**
- Reduce VUs: `k6 run --vus 25 loadtest.js`
- Increase ramp-up time
- Check application logs
- Verify resource limits

---

## Best Practices

### 1. Start Small

```bash
# Smoke test first
k6 run --vus 1 --duration 30s loadtest.js

# Then gradually increase
k6 run --vus 10 --duration 1m loadtest.js
k6 run --vus 50 --duration 2m loadtest.js
```

### 2. Baseline Performance

Run test against:
- Empty database
- Database with 1000 records
- Database with 100,000 records

Compare results to find performance degradation points.

### 3. Test Regularly

```bash
# Add to CI/CD pipeline
# .github/workflows/load-test.yml
- name: Run Load Test
  run: |
    k6 run --quiet loadtest.js
    if [ $? -ne 0 ]; then
      echo "Load test failed!"
      exit 1
    fi
```

### 4. Test Different Scenarios

- Peak hours (high load)
- Off-peak (low load)
- Deployment scenarios
- Database failover
- Network latency

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Test

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Run nightly at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Start Application
        run: |
          docker-compose up -d
          sleep 30  # Wait for app to be ready
      
      - name: Run Load Test
        run: k6 run loadtest.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: loadtest-results.json
```

---

## Resources

- **k6 Documentation**: https://k6.io/docs/
- **k6 Examples**: https://github.com/grafana/k6-learn
- **k6 Cloud**: https://k6.io/cloud/ (for distributed testing)
- **Grafana k6**: https://grafana.com/oss/k6/

---

**Last Updated:** January 2026
**Version:** 1.0
