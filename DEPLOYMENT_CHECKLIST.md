# ✅ Cloud-Native Deployment Checklist

## Pre-Deployment Checklist

### ✓ Development Setup
- [ ] Docker installed & running (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] Git configured
- [ ] SSH keys set up (for repository access)
- [ ] 4GB+ free disk space available
- [ ] 2GB+ free RAM available

### ✓ Repository & Code
- [ ] Code committed to Git
- [ ] `.env.example` file exists
- [ ] All dependencies in `package.json`
- [ ] No secrets in code repository
- [ ] `.gitignore` properly configured
- [ ] README documentation complete

### ✓ Kubernetes (if using K8s)
- [ ] kubectl installed (`kubectl version`)
- [ ] Kubernetes cluster accessible (`kubectl cluster-info`)
- [ ] kubeconfig properly configured
- [ ] Cluster has sufficient resources
  - [ ] 4 CPU cores minimum
  - [ ] 8GB RAM minimum
  - [ ] 20GB storage minimum
- [ ] Default storage class configured (`kubectl get sc`)
- [ ] Namespace creation permissions

### ✓ SSL/TLS Certificates
- [ ] SSL certificates generated or prepared
  - [ ] Valid certificate file (cert.pem)
  - [ ] Valid private key file (key.pem)
  - [ ] Not expired
  - [ ] Proper domain coverage

### ✓ Environment Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `POSTGRES_PASSWORD` is strong (32+ chars)
- [ ] `JWT_SECRET` is random & strong (openssl rand -hex 32)
- [ ] `SESSION_SECRET` is random & strong
- [ ] `GF_SECURITY_ADMIN_PASSWORD` is changed
- [ ] `NODE_ENV` set to correct value
- [ ] `LOG_LEVEL` appropriate for environment

### ✓ Database
- [ ] `init.sql` properly configured
- [ ] Database schema created
- [ ] Initial data loaded (if needed)
- [ ] Backup strategy defined
- [ ] Backup location accessible
- [ ] Recovery procedure tested

---

## Docker Compose Deployment

### ✓ Pre-Deployment
- [ ] All prerequisites from above checked
- [ ] Docker daemon running (`docker ps`)
- [ ] Sufficient disk space
- [ ] Network ports available:
  - [ ] 80 (HTTP)
  - [ ] 443 (HTTPS/optional)
  - [ ] 3000 (Backend)
  - [ ] 3001 (Grafana)
  - [ ] 5432 (PostgreSQL)
  - [ ] 9090 (Prometheus)
  - [ ] 9093 (AlertManager)

### ✓ SSL Setup
```bash
- [ ] mkdir -p ssl
- [ ] bash ssl/generate-certs.sh  (or manual generation)
- [ ] Verify: ls -la ssl/cert.pem ssl/key.pem
```

### ✓ Configuration
```bash
- [ ] cp .env.example .env
- [ ] nano .env  (edit with actual values)
- [ ] Verify each variable is set
```

### ✓ Build & Start
```bash
- [ ] docker-compose -f docker-compose.prod.yml build
- [ ] docker-compose -f docker-compose.prod.yml up -d
- [ ] docker-compose -f docker-compose.prod.yml ps  (check all running)
- [ ] docker-compose -f docker-compose.prod.yml logs  (check for errors)
```

### ✓ Post-Deployment
- [ ] Backend health check: `curl http://localhost:3000/health`
- [ ] Frontend accessible: `curl http://localhost:80`
- [ ] Database accessible: `docker-compose exec postgres psql -U consearch_user -d consearch_db -c "SELECT 1"`
- [ ] Prometheus scraping: Visit http://localhost:9090/targets
- [ ] Grafana accessible: http://localhost:3001 (login: admin/admin)
- [ ] AlertManager accessible: http://localhost:9093

### ✓ Verification
```bash
- [ ] All containers running: docker-compose ps
- [ ] No high CPU/memory usage: docker stats
- [ ] Database connected: docker-compose logs postgres
- [ ] Backend responding: docker-compose logs backend
- [ ] Nginx healthy: docker-compose logs nginx
```

### ✓ Testing
- [ ] Test login endpoint: `curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'`
- [ ] Test API endpoint: `curl http://localhost:3000/api/tickets`
- [ ] Test metrics: `curl http://localhost:3000/metrics`
- [ ] Test health: `curl http://localhost:3000/health`

### ✓ Monitoring
- [ ] Prometheus metrics collected: check /metrics endpoint
- [ ] Grafana dashboard loading data
- [ ] No alerts firing unnecessarily
- [ ] Default alert rules appropriate for environment

---

## Kubernetes Deployment

### ✓ Pre-Deployment
- [ ] All prerequisites from above checked
- [ ] kubectl authenticated to cluster
- [ ] Cluster capacity sufficient
- [ ] Network policies supported (if using)
- [ ] Storage provisioner available
- [ ] RBAC enabled

### ✓ Namespace & RBAC
```bash
- [ ] kubectl create namespace consearch  (or via YAML)
- [ ] kubectl get namespace consearch  (verify)
- [ ] RBAC roles created
- [ ] Service accounts created
- [ ] Verify permissions: kubectl auth can-i get pods --as=system:serviceaccount:consearch:backend -n consearch
```

### ✓ Secrets & ConfigMaps
```bash
- [ ] kubectl create secret generic backend-secret -n consearch --from-literal=JWT_SECRET=$(openssl rand -hex 32) ...
- [ ] kubectl create configmap backend-config -n consearch --from-literal=NODE_ENV=production ...
- [ ] kubectl get secrets -n consearch
- [ ] kubectl get configmaps -n consearch
```

### ✓ Build & Push Docker Image
```bash
- [ ] docker build -f Dockerfile.prod -t consearch/backend:latest .
- [ ] docker tag consearch/backend:latest <registry>/consearch/backend:latest
- [ ] docker push <registry>/consearch/backend:latest
- [ ] Verify image in registry
```

### ✓ Deploy Resources
```bash
- [ ] kubectl apply -f k8s/00-namespace-configmap.yaml
- [ ] kubectl apply -f k8s/01-postgres.yaml
- [ ] Wait: kubectl get pod -n consearch -w  (wait for postgres Ready)
- [ ] kubectl apply -f k8s/02-backend.yaml
- [ ] kubectl apply -f k8s/03-nginx.yaml
- [ ] kubectl apply -f k8s/04-prometheus.yaml
- [ ] kubectl apply -f k8s/05-grafana.yaml
- [ ] kubectl apply -f k8s/06-alertmanager.yaml
```

### ✓ Verify Deployment
```bash
- [ ] kubectl get ns  (namespace exists)
- [ ] kubectl get pods -n consearch  (all pods running)
- [ ] kubectl get svc -n consearch  (all services)
- [ ] kubectl get pvc -n consearch  (storage claimed)
- [ ] kubectl get configmap -n consearch  (configs applied)
- [ ] kubectl get secrets -n consearch  (secrets applied)
```

### ✓ Pod Status Checks
```bash
- [ ] All pods in Running state
- [ ] All containers Ready (1/1)
- [ ] No restarts or crashes
- [ ] Verify: kubectl get pods -n consearch -o wide
- [ ] Check events: kubectl get events -n consearch
- [ ] Describe pods: kubectl describe pod -n consearch <pod-name>
```

### ✓ Health Checks
```bash
- [ ] Port-forward: kubectl -n consearch port-forward svc/backend 3000:3000
- [ ] Test backend: curl http://localhost:3000/health
- [ ] Port-forward: kubectl -n consearch port-forward svc/nginx 8080:8080
- [ ] Test frontend: curl http://localhost:8080/
- [ ] Port-forward: kubectl -n consearch port-forward svc/grafana 3000:3000
- [ ] Test grafana: curl http://localhost:3000/api/health
```

### ✓ Network Connectivity
```bash
- [ ] Test pod-to-pod: kubectl exec -n consearch deployment/backend -- curl http://postgres:5432
- [ ] Test service DNS: kubectl exec -n consearch deployment/backend -- curl http://backend:3000/health
- [ ] Check network policies: kubectl get networkpolicy -n consearch
```

### ✓ Storage Verification
```bash
- [ ] PVC bound: kubectl get pvc -n consearch  (Status: Bound)
- [ ] PV created: kubectl get pv
- [ ] Test write/read: kubectl exec deployment/postgres -n consearch -- touch /var/lib/postgresql/data/test.txt
```

### ✓ Monitoring Setup
```bash
- [ ] Prometheus scraping backend: kubectl -n consearch logs deployment/prometheus | grep "scrape"
- [ ] Grafana datasource connected: Check /api/datasources
- [ ] AlertManager loaded rules: curl http://localhost:9093/api/v1/rules
- [ ] Alert notifications configured (if applicable)
```

### ✓ Testing
```bash
- [ ] Create test pod: kubectl run -n consearch test --image=curl -it -- curl http://backend:3000/health
- [ ] Backend logs: kubectl logs -n consearch deployment/backend
- [ ] Database logs: kubectl logs -n consearch deployment/postgres
- [ ] Nginx logs: kubectl logs -n consearch deployment/nginx
```

### ✓ Scaling Test
```bash
- [ ] Scale backend: kubectl scale deployment backend -n consearch --replicas=3
- [ ] Verify: kubectl get pods -n consearch | grep backend  (3 pods)
- [ ] Check load distribution: kubectl top pods -n consearch
- [ ] Verify HPA: kubectl get hpa -n consearch
```

---

## Production Readiness Checklist

### ✓ Security
- [ ] All default passwords changed
- [ ] HTTPS properly configured
- [ ] Secrets not in code/logs
- [ ] Network policies applied
- [ ] RBAC enforced
- [ ] Pod security policies applied
- [ ] Resource limits set
- [ ] No privileged containers
- [ ] Container security scanning passed
- [ ] Vulnerability scan completed

### ✓ Monitoring & Logging
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards configured
- [ ] Alert rules defined
- [ ] AlertManager notifications configured
- [ ] Log aggregation setup (ELK/Loki/etc)
- [ ] Centralized logging enabled
- [ ] Security event logging enabled
- [ ] Audit logs enabled
- [ ] Log retention policy defined

### ✓ Backup & Recovery
- [ ] Database backups automated
- [ ] Backup location secured
- [ ] Backup retention policy defined
- [ ] Recovery procedure tested
- [ ] RTO/RPO defined and acceptable
- [ ] Backup encryption enabled
- [ ] Disaster recovery plan documented

### ✓ Performance
- [ ] Load testing completed
- [ ] Baseline metrics established
- [ ] Scaling tested
- [ ] Latency acceptable
- [ ] Error rate < 0.1%
- [ ] Resource utilization optimal
- [ ] Database queries optimized

### ✓ Documentation
- [ ] Architecture documented
- [ ] Deployment procedure documented
- [ ] Runbook created
- [ ] Troubleshooting guide created
- [ ] Disaster recovery plan documented
- [ ] API documentation complete
- [ ] Change log maintained

### ✓ Maintenance
- [ ] Upgrade procedure documented
- [ ] Maintenance window scheduled
- [ ] Maintenance notification plan
- [ ] Dependency updates planned
- [ ] Security patches process defined

### ✓ Compliance
- [ ] Data protection regulations reviewed
- [ ] GDPR compliance (if applicable)
- [ ] Security compliance checked
- [ ] Audit trails enabled
- [ ] Privacy policy updated

---

## Post-Deployment Verification

### ✓ Week 1
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Monitor response times (p99 < 200ms)
- [ ] Monitor resource usage (CPU < 60%, Memory < 70%)
- [ ] Check alert firing accuracy
- [ ] Verify backup completion
- [ ] Review logs for issues
- [ ] Check security logs
- [ ] Verify all monitoring working

### ✓ Week 2-4
- [ ] Run full test suite
- [ ] Perform chaos engineering tests
- [ ] Test failover scenarios
- [ ] Verify auto-recovery
- [ ] Check performance trends
- [ ] Review and optimize alerts
- [ ] Conduct security review
- [ ] Update runbooks based on findings

### ✓ Ongoing
- [ ] Daily: Check metrics & alerts
- [ ] Weekly: Review logs & performance
- [ ] Monthly: Conduct security audit
- [ ] Quarterly: Disaster recovery drill
- [ ] Quarterly: Performance review
- [ ] Annually: Compliance audit

---

## Rollback Procedure

### If Deployment Fails

#### Docker Compose
```bash
# 1. Stop services
docker-compose -f docker-compose.prod.yml down

# 2. Revert to previous version
git checkout HEAD~1

# 3. Rebuild & restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
docker-compose -f docker-compose.prod.yml ps
```

#### Kubernetes
```bash
# 1. Check rollout history
kubectl rollout history deployment/backend -n consearch

# 2. Rollback to previous
kubectl rollout undo deployment/backend -n consearch

# 3. Verify
kubectl rollout status deployment/backend -n consearch

# 4. Check pods
kubectl get pods -n consearch
```

---

## Emergency Procedures

### Service Down
1. [ ] Check pod status: `kubectl get pods -n consearch`
2. [ ] Check logs: `kubectl logs deployment/backend -n consearch`
3. [ ] Check resource limits: `kubectl top pods -n consearch`
4. [ ] Check node status: `kubectl get nodes`
5. [ ] Restart pod: `kubectl delete pod -n consearch <pod-name>`
6. [ ] Scale up if needed: `kubectl scale deployment backend -n consearch --replicas=5`

### Database Down
1. [ ] Check postgres pod: `kubectl get pod -n consearch -l app=postgres`
2. [ ] Check PVC: `kubectl get pvc -n consearch`
3. [ ] Check storage: `kubectl describe pvc postgres-pvc -n consearch`
4. [ ] Restore from backup: [Recovery procedure]
5. [ ] Restart pod: `kubectl delete pod -n consearch deployment/postgres`

### High CPU/Memory
1. [ ] Identify pod: `kubectl top pods -n consearch`
2. [ ] Check logs for errors: `kubectl logs <pod>`
3. [ ] Scale up: `kubectl scale deployment backend -n consearch --replicas=5`
4. [ ] Apply resource limits: Update deployment manifest
5. [ ] Investigate root cause

---

**Status**: ✓ Ready for Deployment  
**Last Updated**: January 2026  
**Version**: 1.0.0

---

## Quick Command Reference

```bash
# Docker Compose Commands
docker-compose -f docker-compose.prod.yml up -d          # Start
docker-compose -f docker-compose.prod.yml down           # Stop
docker-compose -f docker-compose.prod.yml ps             # Status
docker-compose -f docker-compose.prod.yml logs -f        # Logs

# Kubernetes Commands
kubectl apply -f k8s/                                     # Deploy
kubectl get pods -n consearch                             # List pods
kubectl logs deployment/backend -n consearch              # View logs
kubectl port-forward svc/backend 3000:3000 -n consearch  # Port forward
kubectl scale deployment backend -n consearch --replicas=3  # Scale
kubectl rollout restart deployment/backend -n consearch   # Restart
```
