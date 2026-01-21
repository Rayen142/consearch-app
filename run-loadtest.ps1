# Load Test Script untuk CONSEARCH
# Menggunakan k6 via Docker

Write-Host "🚀 Starting Load Test with k6..." -ForegroundColor Cyan
Write-Host "Target: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

docker run --rm -i --network=host -v ${PWD}:/work -w /work grafana/k6 run loadtest.js

Write-Host ""
Write-Host "✅ Load Test Completed!" -ForegroundColor Green
