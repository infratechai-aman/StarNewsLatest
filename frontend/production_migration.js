const BASE_URL = 'https://star-news-latest.vercel.app/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function runProductionMigration() {
    console.log('🚀 Starting PRODUCTION Migration...');
    console.log(`Target: ${BASE_URL}`);

    // 1. Login to Production
    try {
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });

        if (!loginRes.ok) {
            const text = await loginRes.text();
            console.log(`❌ Production Login Failed (${loginRes.status}):`, text);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Production Login: OK');

        // 2. Trigger Migration
        console.log('Triggering Migration & Indexing...');
        const res = await fetch(`${BASE_URL}/admin/migrate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (res.ok) {
            console.log('✅ SUCCESS: Production indexes applied.');
        } else {
            console.log('❌ FAIL: Migration failed.');
        }

    } catch (e) {
        console.error('❌ Network Error:', e.message);
    }
}

runProductionMigration();
