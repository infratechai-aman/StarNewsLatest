const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';
const REPORTER_EMAIL = 'aman@reporterStarNews';
const REPORTER_PASS = 'StarNews@123';

async function runTests() {
    console.log('🚀 Starting Admin Panel Detailed Tests...\n');

    let adminToken = '';
    let reporterToken = '';

    // 1. Authentication
    try {
        console.log('1. Authentication...');
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
            return; // Cannot proceed without admin token
        }

        const repLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: REPORTER_EMAIL, password: REPORTER_PASS })
        });
        const repData = await repLoginRes.json();
        if (repLoginRes.ok) {
            reporterToken = repData.token;
            console.log('✅ Reporter Login: OK');
        } else {
            console.log('❌ Reporter Login: FAIL', repData);
        }
    } catch (e) {
        console.error('❌ Auth Error:', e.message);
    }

    // 2. Dashboard Stats
    try {
        console.log('\n2. Dashboard Stats...');
        const res = await fetch(`${BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (res.ok) console.log('✅ Get Stats: OK', Object.keys(data));
        else console.log('❌ Get Stats: FAIL', data);
    } catch (e) { console.error('❌ Stats Error:', e.message); }

    // 3. Pending Items
    try {
        console.log('\n3. Pending Items...');
        const res = await fetch(`${BASE_URL}/admin/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (res.ok) {
            console.log('✅ Get Pending Items: OK');
            console.log(`   - Pending News: ${data.news ? data.news.length : 0}`);
            console.log(`   - Pending Users: ${data.users ? data.users.length : 0}`);
        } else {
            console.log('❌ Get Pending Items: FAIL', data);
        }
    } catch (e) { console.error('❌ Pending items Error:', e.message); }

    // 4. Verify My Articles (New Fix)
    if (reporterToken) {
        try {
            console.log('\n4. Verify My Articles (Reporter)...');
            const res = await fetch(`${BASE_URL}/news/my-articles`, {
                headers: { 'Authorization': `Bearer ${reporterToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Get My Articles: OK');
                console.log(`   - Articles Found: ${data.articles ? data.articles.length : 0}`);
            } else {
                console.log(`❌ Get My Articles: FAIL (${res.status})`);
                const text = await res.text();
                console.log('   Response:', text);
            }
        } catch (e) { console.error('❌ My Articles Error:', e.message); }
    }

    // 5. User Management (List Reporters)
    try {
        console.log('\n5. User Management...');
        const res = await fetch(`${BASE_URL}/admin/users/reporters`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) console.log('✅ List Reporters: OK');
        else console.log(`❌ List Reporters: FAIL (${res.status})`);
    } catch (e) { console.error('❌ User Mgmt Error:', e.message); }

    // 6. E-Newspapers
    try {
        console.log('\n6. E-Newspapers...');
        const res = await fetch(`${BASE_URL}/admin/enewspaper`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) console.log('✅ List E-Newspapers: OK');
        else console.log(`❌ List E-Newspapers: FAIL (${res.status})`);
    } catch (e) { console.error('❌ Epapers Error:', e.message); }

    // 7. Business Promotions
    try {
        console.log('\n7. Business Promotions...');
        const res = await fetch(`${BASE_URL}/business-promotions`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) console.log('✅ List Business Promotions: OK');
        else console.log(`❌ List Business Promotions: FAIL (${res.status})`);
    } catch (e) { console.error('❌ Biz Promo Error:', e.message); }

    // 8. Pending Ticker
    try {
        console.log('\n8. Pending Ticker...');
        const res = await fetch(`${BASE_URL}/admin/pending-ticker`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) console.log('✅ Get Pending Ticker: OK');
        else console.log(`❌ Get Pending Ticker: FAIL (${res.status})`);
    } catch (e) { console.error('❌ Ticker Error:', e.message); }

    console.log('\nDone.');
}

runTests();
