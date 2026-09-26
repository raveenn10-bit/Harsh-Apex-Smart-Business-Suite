const http = require('http');

const demoUsers = [
  { email: 'basic1@demo.harshapex.com.lk', pass: 'BasicDemo@1', expectedPkg: 'BASIC' },
  { email: 'basic2@demo.harshapex.com.lk', pass: 'BasicDemo@2', expectedPkg: 'BASIC' },
  { email: 'business1@demo.harshapex.com.lk', pass: 'BusinessDemo@1', expectedPkg: 'BUSINESS' },
  { email: 'business2@demo.harshapex.com.lk', pass: 'BusinessDemo@2', expectedPkg: 'BUSINESS' },
  { email: 'premium1@demo.harshapex.com.lk', pass: 'PremiumDemo@1', expectedPkg: 'PREMIUM' },
  { email: 'premium2@demo.harshapex.com.lk', pass: 'PremiumDemo@2', expectedPkg: 'PREMIUM' },
];

function login(user) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: user.email, password: user.pass });
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, body: parsed, cookie: res.headers['set-cookie'] });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing live HTTP authentication for all 6 demo accounts:\n');
  for (const user of demoUsers) {
    const res = await login(user);
    if (res.status === 200 && res.body.success && res.body.user.package_code === user.expectedPkg) {
      console.log(`[PASS] ${user.email} -> ${res.body.user.package_code} (${res.body.user.business_name})`);
    } else {
      console.error(`[FAIL] ${user.email} failed:`, res);
      process.exit(1);
    }
  }
  console.log('\nAll 6 demo accounts authenticated successfully via HTTP with correct package tiers & workspaces!');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
