# Monitoring & Observability Stack Configuration

## 📊 Prometheus Configuration

Prometheus mengumpulkan metrics dari aplikasi backend setiap 15 detik.

### Metrics yang dikumpulkan:

```
# Application Metrics
- http_requests_total{method, route, status}        # Total HTTP requests
- http_request_duration_seconds{method, route}      # Request latency
- tickets_sold_total                                # Business metric

# System Metrics (dari prom-client)
- process_cpu_seconds_total
- process_resident_memory_bytes
- nodejs_heap_size_used_bytes
- nodejs_heap_size_limit_bytes
- nodejs_eventloop_lag_seconds
```

### Alert Rules

Located in `k8s/04-prometheus.yaml`:

1. **HighErrorRate**
   - Condition: Error rate (5xx) > 5% dalam 5 menit
   - Severity: critical
   - Action: Trigger alert ke AlertManager

2. **HighMemoryUsage**
   - Condition: Memory usage > 80% dalam 2 menit
   - Severity: warning
   - Action: Trigger alert

3. **HighCPUUsage**
   - Condition: CPU usage > 70% dalam 2 menit
   - Severity: warning
   - Action: Trigger alert

4. **BackendDown**
   - Condition: Backend pod unreachable selama 2 menit
   - Severity: critical
   - Action: Immediate alert

5. **PostgresDown**
   - Condition: Database unreachable selama 2 menit
   - Severity: critical
   - Action: Immediate alert

## 📈 Grafana Dashboards

### Pre-configured Dashboards:

1. **Backend Monitoring Dashboard**
   - Request rate (req/s)
   - Error rate (%)
   - Response time (ms)
   - Active connections
   - Memory usage
   - CPU usage
   - Pod restart count

### Accessing Grafana:
```
URL: http://localhost:3001
Username: admin
Password: admin (change in production)
```

### Import Custom Dashboard:
1. Go to Dashboards → New → Import
2. Upload JSON file atau gunakan Dashboard ID
3. Select Prometheus sebagai data source

## 🚨 AlertManager Configuration

AlertManager mengelola routing, grouping, dan silencing dari alerts.

### Features:

- **Alert Routing**: Route alerts berdasarkan severity/labels
- **Grouping**: Group related alerts untuk mengurangi noise
- **Notification**: Kirim ke email, Slack, PagerDuty, etc
- **Silencing**: Temporarily suppress alerts
- **Inhibition**: Suppress lower priority alerts

### Notification Channels (Configure di alertmanager.yml):

#### Email Notification:
```yaml
receivers:
  - name: 'critical'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'user@example.com'
        auth_password: 'password'
```

#### Slack Notification:
```yaml
receivers:
  - name: 'critical'
    slack_configs:
      - api_url: 'YOUR_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### PagerDuty Notification:
```yaml
receivers:
  - name: 'critical'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        description: '{{ .GroupLabels.alertname }}'
```

#### Telegram Notification:
```yaml
receivers:
  - name: 'critical'
    webhook_configs:
      - url: 'http://localhost:9099/alert'
```

## 📋 Logging & Log Aggregation

### Application Logging:

Backend menggunakan console.log dengan LOG_LEVEL environment variable.

```javascript
// app.js
if (LOG_LEVEL !== 'silent') {
    console.log('Request:', method, route, status);
}
```

### Recommended Log Aggregation Stack:

1. **ELK Stack** (Elasticsearch, Logstash, Kibana)
   ```yaml
   services:
     elasticsearch:
       image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
       environment:
         - discovery.type=single-node
     
     logstash:
       image: docker.elastic.co/logstash/logstash:8.0.0
       volumes:
         - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
     
     kibana:
       image: docker.elastic.co/kibana/kibana:8.0.0
       ports:
         - "5601:5601"
   ```

2. **Loki Stack** (Loki, Promtail, Grafana)
   ```yaml
   services:
     loki:
       image: grafana/loki:latest
     
     promtail:
       image: grafana/promtail:latest
       volumes:
         - /var/log:/var/log:ro
         - ./promtail-config.yml:/etc/promtail/config.yml
   ```

3. **Splunk** (SaaS solution)

4. **Datadog** (SaaS solution)

## 🔍 Tracing & APM

### Recommended Tracing Solutions:

1. **Jaeger**
   ```javascript
   const jaeger = require('jaeger-client');
   
   const initTracer = (serviceName) => {
     return jaeger.initTracer({
       serviceName: serviceName,
       sampler: {
         type: 'const',
         param: 1,
       },
       reporter: {
         logSpans: true,
         agentHost: 'localhost',
         agentPort: 6831,
       },
     });
   };
   ```

2. **Zipkin**

3. **DataDog APM**

4. **New Relic**

5. **Elastic APM**

## 📱 Health Checks

### Liveness Probe
- Endpoint: `/health`
- Method: GET
- Response: `{ "status": "ok" }`
- Interval: 10s
- Used by: Kubernetes untuk restart pod yang stuck

### Readiness Probe
- Endpoint: `/health`
- Method: GET
- Response: `{ "status": "ready" }`
- Interval: 5s
- Used by: Kubernetes untuk load balancing

### Startup Probe (optional)
- Endpoint: `/health/startup`
- Method: GET
- Used by: Pod yang butuh waktu lama untuk startup

## 📊 Metrics Export Formats

### Prometheus Format (default)
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET", route="/api/tickets", status="200"} 1523
```

### JSON Format (untuk dashboards)
```json
{
  "http_requests_total": 1523,
  "http_request_duration_seconds": 0.234,
  "tickets_sold_total": 456
}
```

## 🔧 Custom Metrics

### Menambah Custom Metrics di Backend:

```javascript
const customCounter = new client.Counter({
  name: 'custom_events_total',
  help: 'Total custom events',
  labelNames: ['event_type', 'source']
});

// Increment counter
customCounter.inc({
  event_type: 'user_login',
  source: 'web'
});

// Register metric
register.registerMetric(customCounter);
```

## 📈 SLO (Service Level Objectives)

### Example SLOs:

```yaml
objectives:
  - name: "Request Success Rate"
    target: 99.9
    metric: "http_requests_total{status!~\"5..\"} / http_requests_total"
  
  - name: "Response Time (p99)"
    target: 200ms
    metric: "histogram_quantile(0.99, http_request_duration_seconds)"
  
  - name: "Availability"
    target: 99.95
    metric: "up{job=\"backend\"}"
```

## 🎯 Performance Tuning

### Prometheus Optimization:
- Adjust scrape interval (default: 15s)
- Increase retention time (default: 30d)
- Enable compression for remote storage

### Grafana Optimization:
- Use appropriate time ranges
- Leverage query caching
- Use recording rules in Prometheus

### Backend Optimization:
- Implement metrics caching
- Use efficient serialization (protobuf vs JSON)
- Limit cardinality of labels

## 📚 References

- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
- [AlertManager Docs](https://prometheus.io/docs/alerting/latest/alertmanager)
- [OpenMetrics](https://openmetrics.io)
