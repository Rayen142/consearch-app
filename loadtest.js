import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const searchDuration = new Trend('search_duration');
const purchaseDuration = new Trend('purchase_duration');

// Konfigurasi load test - Simulasi lonjakan pengguna
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up: 10 pengguna dalam 30 detik
    { duration: '1m', target: 100 },   // Lonjakan: dari 10 ke 100 pengguna dalam 1 menit
    { duration: '3m', target: 100 },   // Mempertahankan: 100 pengguna selama 3 menit
    { duration: '1m', target: 50 },    // Penurunan bertahap: turun ke 50 pengguna
    { duration: '30s', target: 0 },    // Cool-down: turun ke 0
  ],
  thresholds: {
    // Target performa yang harus dipenuhi
    http_req_duration: ['p(95)<500'], // 95% request harus < 500ms
    http_req_failed: ['rate<0.05'],   // Error rate harus < 5%
    errors: ['rate<0.1'],             // Custom error rate < 10%
    login_duration: ['p(95)<800'],    // Login p95 < 800ms
    search_duration: ['p(95)<300'],   // Search p95 < 300ms
    purchase_duration: ['p(95)<1000'], // Purchase p95 < 1000ms
  },
};

// Base URL - sesuaikan dengan environment Anda
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Data test untuk registrasi dan login
function generateRandomUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@example.com`,
    password: 'TestPassword123!',
  };
}

// Fungsi untuk login
function login(username, password) {
  const loginPayload = JSON.stringify({
    username: username,
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/login`, loginPayload, params);
  loginDuration.add(Date.now() - loginStart);

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return null;
  }

  return loginRes.json('token');
}

// Fungsi untuk mencari konser
function searchConcerts(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const searchStart = Date.now();
  const searchRes = http.get(`${BASE_URL}/concerts`, params);
  searchDuration.add(Date.now() - searchStart);

  const searchSuccess = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns data': (r) => r.json().length >= 0,
  });

  if (!searchSuccess) {
    errorRate.add(1);
    return [];
  }

  return searchRes.json();
}

// Fungsi untuk membeli tiket
function purchaseTicket(token, concertId) {
  const purchasePayload = JSON.stringify({
    concert_id: concertId,
    quantity: Math.floor(Math.random() * 3) + 1, // 1-3 tiket
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const purchaseStart = Date.now();
  const purchaseRes = http.post(`${BASE_URL}/purchase`, purchasePayload, params);
  purchaseDuration.add(Date.now() - purchaseStart);

  const purchaseSuccess = check(purchaseRes, {
    'purchase status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  if (!purchaseSuccess) {
    errorRate.add(1);
  }

  return purchaseSuccess;
}

// Skenario utama test
export default function () {
  // 1. Registrasi pengguna baru (20% dari VU)
  if (Math.random() < 0.2) {
    const newUser = generateRandomUser();
    
    const registerPayload = JSON.stringify({
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const registerRes = http.post(`${BASE_URL}/register`, registerPayload, params);
    
    check(registerRes, {
      'registration status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);

    sleep(1);
  }

  // 2. Login dengan user yang sudah ada
  // Gunakan kredensial default atau user yang baru dibuat
  const testUser = {
    username: 'testuser',
    password: 'password123',
  };

  const token = login(testUser.username, testUser.password);
  
  if (!token) {
    sleep(2);
    return; // Skip jika login gagal
  }

  sleep(1);

  // 3. Cari konser yang tersedia
  const concerts = searchConcerts(token);
  
  sleep(Math.random() * 2 + 1); // Random sleep 1-3 detik

  // 4. Beli tiket (60% dari yang berhasil login akan mencoba beli)
  if (concerts.length > 0 && Math.random() < 0.6) {
    const randomConcert = concerts[Math.floor(Math.random() * concerts.length)];
    purchaseTicket(token, randomConcert.id);
    sleep(1);
  }

  // 5. Cek metrics endpoint (untuk validasi monitoring)
  if (Math.random() < 0.1) { // 10% VU akan cek metrics
    const metricsRes = http.get(`${BASE_URL}/metrics`);
    check(metricsRes, {
      'metrics endpoint is accessible': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 detik
}

// Setup function - dijalankan sekali di awal test
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Test will simulate user spike from 10 to 100 users in 1 minute');
  
  // Buat user default untuk testing jika belum ada
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  const registerPayload = JSON.stringify(defaultUser);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(`${BASE_URL}/register`, registerPayload, params);
  
  return { timestamp: Date.now() };
}

// Teardown function - dijalankan sekali di akhir test
export function teardown(data) {
  console.log('Load test completed!');
  console.log(`Started at: ${new Date(data.timestamp)}`);
  console.log(`Finished at: ${new Date()}`);
}

// Fungsi untuk menampilkan summary hasil test
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'loadtest-results.json': JSON.stringify(data),
  };
}

// Helper function untuk text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n\n';
  summary += `${indent}========================================\n`;
  summary += `${indent}  K6 LOAD TEST SUMMARY\n`;
  summary += `${indent}========================================\n\n`;
  
  summary += `${indent}Scenarios:\n`;
  summary += `${indent}  Total Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += `${indent}  Total VUs: ${data.metrics.vus.values.max}\n`;
  summary += `${indent}  Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n\n`;
  
  summary += `${indent}HTTP Performance:\n`;
  summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}\n`;
  summary += `${indent}  Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  P99 Duration: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  
  summary += `${indent}Custom Metrics:\n`;
  if (data.metrics.login_duration) {
    summary += `${indent}  Login P95: ${data.metrics.login_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.search_duration) {
    summary += `${indent}  Search P95: ${data.metrics.search_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.purchase_duration) {
    summary += `${indent}  Purchase P95: ${data.metrics.purchase_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.errors) {
    summary += `${indent}  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += `\n${indent}========================================\n\n`;
  
  return summary;
}
