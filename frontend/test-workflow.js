const http = require('http');

async function runTests() {
    console.log('🚀 Starting Automated Workflow Tests on localhost:3000...\n');
    let passed = 0;
    let failed = 0;

    async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const res = await fetch(`http://localhost:3000/api${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json().catch(() => null);
            return { status: res.status, data };
        } catch (e) {
            return { status: 500, error: e.message };
        }
    }

    // --- TEST 1: Public Classifieds Fetch ---
    process.stdout.write('Test 1: Fetch Classifieds (Public API)... ');
    const res1 = await fetchAPI('/classifieds');
    if (res1.status === 200 && res1.data && Array.isArray(res1.data.classifieds)) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res1.status}, Data: ${JSON.stringify(res1.data)})`);
        failed++;
    }

    // --- TEST 2: Submit Classified (Rate Limiter Check) ---
    process.stdout.write('Test 2: Submit Classified without Title (Validation Check)... ');
    const res2 = await fetchAPI('/classifieds/submit', 'POST', { description: 'Test', price: 100 });
    if (res2.status === 400 && res2.data.error === 'Title is required') {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res2.status}, Data: ${JSON.stringify(res2.data)})`);
        failed++;
    }

    // --- TEST 3: Public Live TV Fetch ---
    process.stdout.write('Test 3: Fetch Live TV Config... ');
    const res3 = await fetchAPI('/live-tv');
    if (res3.status === 200 && 'enabled' in res3.data) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res3.status})`);
        failed++;
    }

    // --- TEST 4: Fetch Breaking Ticker ---
    process.stdout.write('Test 4: Fetch Breaking Ticker... ');
    const res4 = await fetchAPI('/breaking-ticker');
    if (res4.status === 200 && 'enabled' in res4.data) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res4.status})`);
        failed++;
    }

    // --- TEST 5: Fetch Businesses ---
    process.stdout.write('Test 5: Fetch Businesses Directory... ');
    const res5 = await fetchAPI('/businesses?limit=5');
    if (res5.status === 200 && Array.isArray(res5.data)) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res5.status})`);
        failed++;
    }

    // --- TEST 6: Protected Route Check (No Auth) ---
    process.stdout.write('Test 6: Try Admin Route without Auth... ');
    const res6 = await fetchAPI('/admin/stats');
    if (res6.status === 401 || res6.status === 403) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log(`❌ FAILED (Status: ${res6.status}) - SECURITY RISK!`);
        failed++;
    }

    console.log(`\n🏁 Test Run Complete: ${passed} Passed, ${failed} Failed`);
}

runTests();
