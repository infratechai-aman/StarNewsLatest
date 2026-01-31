const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function debug() {
    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log('Token:', token ? 'GOT TOKEN' : 'NO TOKEN');

    // Hit admin stats
    console.log('Hitting /admin/stats...');
    const res = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
}

debug();
