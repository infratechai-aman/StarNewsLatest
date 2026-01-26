const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';
const REPORTER_EMAIL = 'aman@reporterStarNews';
const REPORTER_PASS = 'StarNews@123';

async function runTests() {
    console.log('🚀 Starting FINAL API Integration Tests (Native Fetch)...\n');

    // 0. Auto-Seed 
    try {
        await fetch(`${BASE_URL}/seed-admin`, { method: 'POST' }).catch(() => { });
        await fetch(`${BASE_URL}/seed-admin`).catch(() => { });
        await fetch(`${BASE_URL}/seed-reporter`, { method: 'POST' }).catch(() => { });
        await fetch(`${BASE_URL}/seed-reporter`).catch(() => { });
        console.log('✅ Seeding initiated');
    } catch (e) { }

    // 1. Login
    console.log('1. Authentication...');
    let adminToken = '', reporterToken = '';

    // Admin Login
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const data = await res.json();
        if (res.ok) adminToken = data.token;
        console.log(res.ok ? '✅ Admin Login: OK' : '❌ Admin Login: FAIL');
    } catch (e) { console.log('❌ Admin Login: ERROR', e.message); }

    // Reporter Login
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: REPORTER_EMAIL, password: REPORTER_PASS })
        });
        const data = await res.json();
        if (res.ok) reporterToken = data.token;
        console.log(res.ok ? '✅ Reporter Login: OK' : '❌ Reporter Login: FAIL');
    } catch (e) { console.log('❌ Reporter Login: ERROR', e.message); }

    // 2. Categories
    console.log('\n2. Categories...');
    let categoryId = '';
    try {
        const listRes = await fetch(`${BASE_URL}/categories`);
        const listData = await listRes.json();
        if (listData.length > 0) {
            categoryId = listData[0].id;
            console.log('✅ Found existing category:', listData[0].name);
        } else {
            const res = await fetch(`${BASE_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({ name: 'Test Cat ' + Date.now(), slug: 'tc-' + Date.now() })
            });
            const data = await res.json();
            if (res.ok) { categoryId = data.id; console.log('✅ Created Category:', data.name); }
            else console.log('❌ Create Category: FAIL');
        }
    } catch (e) { console.log('❌ Category: ERROR', e.message); }

    // 3. News Cycle
    console.log('\n3. News Cycle...');
    let articleId = '';
    if (reporterToken && categoryId) {
        try {
            const res = await fetch(`${BASE_URL}/reporter/news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${reporterToken}` },
                body: JSON.stringify({
                    title: 'Test Article ' + Date.now(),
                    content: 'Content here',
                    categoryId: categoryId,
                    mainImage: 'https://via.placeholder.com/150'
                })
            });
            const data = await res.json();
            if (res.ok) { articleId = data.id; console.log('✅ News Submitted: OK'); }
            else console.log('❌ News Submit: FAIL', data);
        } catch (e) { console.log('❌ News Submit: ERROR', e.message); }
    }

    if (adminToken && articleId) {
        try {
            const res = await fetch(`${BASE_URL}/admin/news/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({ articleId, action: 'approve' })
            });
            if (res.ok) console.log('✅ News Approved: OK');
            else console.log('❌ News Approve: FAIL');
        } catch (e) { console.log('❌ News Approve: ERROR', e.message); }
    }

    // 4. Business Cycle
    console.log('\n4. Business Cycle...');
    let businessId = '';
    try {
        const res = await fetch(`${BASE_URL}/businesses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${reporterToken}` },
            body: JSON.stringify({
                name: 'Biz ' + Date.now(),
                description: 'Desc',
                category: 'IT',
                city: 'Pune',
                phone: '123'
            })
        });
        const data = await res.json();
        if (res.ok) { businessId = data.id; console.log('✅ Business Created: OK'); }
        else console.log('❌ Business Create: FAIL', data);
    } catch (e) { }

    if (adminToken && businessId) {
        try {
            const res = await fetch(`${BASE_URL}/admin/businesses/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({ businessId, action: 'approve' })
            });
            if (res.ok) console.log('✅ Business Approved: OK');
            else console.log('❌ Business Approve: FAIL');
        } catch (e) { }
    }

    // 5. Classifieds Cycle
    console.log('\n5. Classifieds Cycle...');
    let classifiedId = '';
    try {
        const res = await fetch(`${BASE_URL}/classifieds/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Classified ' + Date.now(),
                description: 'Desc',
                category: 'Other',
                price: 100,
                contactName: 'User',
                contactPhone: '111',
                location: 'Pune'
            })
        });
        const data = await res.json();
        if (res.ok) { classifiedId = data.id; console.log('✅ Classified Submitted: OK'); }
        else console.log('❌ Classified Submit: FAIL', data);
    } catch (e) { }

    if (adminToken && classifiedId) {
        try {
            const res = await fetch(`${BASE_URL}/admin/classifieds/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({ classifiedId, action: 'approve' })
            });
            if (res.ok) console.log('✅ Classified Approved: OK');
            else console.log('❌ Classified Approve: FAIL');
        } catch (e) { }
    }

    // 6. Stats & Home
    try {
        if (adminToken) {
            const res = await fetch(`${BASE_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            if (res.ok) console.log('✅ Stats: OK');
        }
        const res = await fetch(`${BASE_URL}/home-content`);
        if (res.ok) console.log('✅ Home Content: OK');
    } catch (e) { }
}

runTests();
