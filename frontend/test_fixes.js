const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function runTests() {
    console.log('🚀 Verifying Fixes...\n');

    // Login
    let adminToken = '';
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const data = await res.json();
        if (res.ok) adminToken = data.token;
    } catch (e) { }

    // 1. Test Admin Create Business (The Bug)
    console.log('1. Testing Admin Create Business...');
    try {
        const res = await fetch(`${BASE_URL}/admin/businesses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Fixed Business ' + Date.now(),
                description: 'Created via admin',
                category: 'IT',
                city: 'Pune',
                phone: '1234567890'
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('✅ Admin Create Business: FIXED (ID:', data.id, ')');
        } else {
            console.log('❌ Admin Create Business: FAIL', data);
        }
    } catch (e) { console.log('❌ Error:', e.message); }

    // 2. Test Public Promote Business (The other Bug)
    console.log('\n2. Testing Public Promote Business...');
    try {
        const res = await fetch(`${BASE_URL}/business-promotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessName: 'Promoted Biz ' + Date.now(),
                ownerName: 'Owner Name',
                phone: '9876543210',
                email: 'test@example.com',
                address: 'Pune',
                description: 'Please promote us'
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('✅ Public Promote Business: FIXED (ID:', data.id, ')');
        } else {
            console.log('❌ Public Promote Business: FAIL', data);
        }
    } catch (e) { console.log('❌ Error:', e.message); }
}

runTests();
