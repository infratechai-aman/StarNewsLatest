const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function run() {
    console.log('Login...');
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    });
    const data = await login.json();
    if (!data.token) {
        console.error('Login Failed', data);
        return;
    }
    console.log('Token Got. Migrating...');
    const res = await fetch(`${BASE_URL}/admin/migrate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${data.token}` }
    });
    const text = await res.text();
    console.log('Migration Result:', res.status, text);
}
run();
