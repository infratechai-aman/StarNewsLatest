import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';
const REPORTER_EMAIL = 'aman@reporterStarNews';
const REPORTER_PASS = 'StarNews@123';

async function runTests() {
    console.log('🚀 Starting API Integration Tests...\n');

    // 0. Auto-Seed (Ensure accounts exist)
    console.log('0. Seeding Database...');
    try {
        await fetch(`${BASE_URL}/seed-admin`);
        // Seed reporter - using GET now that we enabled it, or POST if not
        await fetch(`${BASE_URL}/seed-reporter`, { method: 'POST' });
        console.log('✅ Seeding request sent');
    } catch (e) {
        console.log('⚠️ Seeding failed (might already exist):', e.message);
    }

    // 1. Test Admin Login
    console.log('1. Testing Admin Login...');
    let adminToken = '';
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            adminToken = data.token;
            console.log('✅ Admin Login Successful');
        } else {
            console.error('❌ Admin Login Failed:', data);
            return;
        }
    } catch (e) {
        console.error('❌ Admin Login Error:', e.message);
        return;
    }

    // 2. Test Reporter Login
    console.log('\n2. Testing Reporter Login...');
    let reporterToken = '';
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: REPORTER_EMAIL, password: REPORTER_PASS })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            reporterToken = data.token;
            console.log('✅ Reporter Login Successful');
        } else {
            console.error('❌ Reporter Login Failed:', data);
        }
    } catch (e) {
        console.error('❌ Reporter Login Error:', e.message);
    }

    // 3. Test Create Category (Admin)
    console.log('\n3. Testing Create Category (Admin)...');
    let categoryId = '';
    try {
        // First try to get existing categories to find one
        const getRes = await fetch(`${BASE_URL}/categories`);
        const existing cats = await getRes.json();

        // Try to create one
        const res = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Integration Test Category ' + Date.now(),
                slug: 'test-cat-' + Date.now()
            })
        });
        const data = await res.json();

        if (res.ok) {
            categoryId = data.id;
            console.log('✅ Category Created:', data.name);
        } else {
            // Fallback to existing if create failed
            if (cats && cats.length > 0) {
                categoryId = cats[0].id;
                console.log('⚠️ using existing category:', cats[0].name);
            } else {
                console.error('❌ Create Category Failed:', data);
            }
        }
    } catch (e) {
        console.error('❌ Create Category Error:', e.message);
    }

    // 4. Test Submit News (Reporter)
    console.log('\n4. Testing Submit News (Reporter)...');
    let articleId = '';
    try {
        if (reporterToken && categoryId) {
            const res = await fetch(`${BASE_URL}/reporter/news`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${reporterToken}`
                },
                body: JSON.stringify({
                    title: 'Integration Test Article ' + Date.now(),
                    content: 'This is a test article created via automation script.',
                    categoryId: categoryId,
                    mainImage: 'https://via.placeholder.com/150'
                })
            });
            const data = await res.json();
            if (res.ok) {
                articleId = data.id;
                console.log('✅ Article Submitted:', data.title);
            } else {
                console.error('❌ Submit Article Failed:', data);
            }
        } else {
            console.log('⚠️ Skipping News Submission (Missing token or category)');
        }
    } catch (e) {
        console.error('❌ Submit Article Error:', e.message);
    }

    // 5. Test Approve News (Admin)
    console.log('\n5. Testing Approve News (Admin)...');
    try {
        if (adminToken && articleId) {
            const res = await fetch(`${BASE_URL}/admin/news/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    articleId: articleId,
                    action: 'approve'
                })
            });
            const data = await res.json();
            if (res.ok) {
                console.log('✅ Article Approved Successfully');
            } else {
                console.error('❌ Approve Article Failed:', data);
            }
        } else {
            console.log('⚠️ Skipping Article Approval (Missing token or articleId)');
        }
    } catch (e) {
        console.error('❌ Approve Article Error:', e.message);
    }
}

runTests();
