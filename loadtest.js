import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users
    { duration: '1m', target: 50 },   // Maintain 50 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be below 5%
  },
};

export default function () {
  // Test homepage
  let res = http.get('http://localhost:3000/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test metrics endpoint
  let metricsRes = http.get('http://localhost:3000/metrics');
  check(metricsRes, {
    'metrics endpoint is 200': (r) => r.status === 200,
  });

  sleep(1);
}
