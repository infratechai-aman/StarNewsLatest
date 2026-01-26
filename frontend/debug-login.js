const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgresql://starnews:StarNews@2026!@31.97.60.66:5432/starnews',
    ssl: false
});

async function testLogin() {
    console.log('Connecting to VPS DB...');
    try {
        const client = await pool.connect();
        console.log('Connected!');

        const email = 'riyaz@starnews.com';
        const password = '123456';

        console.log(`Searching for user: ${email}`);
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log('User NOT FOUND in DB');
        } else {
            const user = res.rows[0];
            console.log('User FOUND:', user.email, 'ID:', user.id);
            console.log('Stored Hash:', user.password);

            console.log('Comparing password...');
            const match = await bcrypt.compare(password, user.password);
            console.log('Password Match Result:', match);

            if (match) {
                console.log('SUCCESS: Credentials are valid.');
            } else {
                console.log('FAILURE: Password mismatch.');
            }
        }
        client.release();
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

testLogin();
