const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'riyaz@starnews.com';
const ADMIN_PASS = 'Macbook@StarNews';

async function debug() {
    console.log('Hitting /auth/login...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        console.log('Status:', loginRes.status);
        const text = await loginRes.text();
        console.log('Body Preview:', text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            console.log('Token:', data.token ? 'YES' : 'NO');
        } catch (e) {
            console.log('Response is NOT JSON');
        }
    } catch (e) {
        console.log('Fetch Error:', e.message);
    }
}
debug();
