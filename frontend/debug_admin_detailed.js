const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function runTests() {
    console.log('🚀 Starting Debug Admin Test...\n');

    let adminToken = '';

    // 1. Authentication
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
            adminToken = loginData.token;
            console.log('✅ Admin Login: OK');
        } else {
            console.log('❌ Admin Login: FAIL', loginData);
            return;
        }
    } catch (e) {
        console.error('❌ Auth Error:', e.message);
        return;
    }

    // 7. Business Promotions
    try {
        console.log('\n7. Business Promotions...');
        const res = await fetch(`${BASE_URL}/business-promotions`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('✅ List Business Promotions: OK', data.length);
        } else {
            const text = await res.text();
            console.log(`❌ List Business Promotions: FAIL (${res.status})`);
            console.log('BODY:', text.substring(0, 1000));
        }
    } catch (e) { console.error('❌ Biz Promo Error:', e.message); }

    // 8. Pending Ticker
    try {
        console.log('\n8. Pending Ticker...');
        const res = await fetch(`${BASE_URL}/admin/pending-ticker`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Get Pending Ticker: OK', data);
        } else {
            const text = await res.text();
            console.log(`❌ Get Pending Ticker: FAIL (${res.status})`);
            console.log('BODY:', text.substring(0, 1000));
        }
    } catch (e) { console.error('❌ Ticker Error:', e.message); }

    console.log('\nDone.');
}

runTests();
