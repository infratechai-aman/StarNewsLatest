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

    // Hit business-promotions
    console.log('Hitting /business-promotions...');
    const res = await fetch(`${BASE_URL}/business-promotions`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);

    // Hit pending-ticker
    console.log('Hitting /admin/pending-ticker...');
    const res2 = await fetch(`${BASE_URL}/admin/pending-ticker`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status2:', res2.status);
    const text2 = await res2.text();
    console.log('Body2:', text2);
}

debug();
