const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://starnews:starnews123@localhost:5432/starnews'
});

async function test() {
    console.log('Testing DB Access...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected to DB');
        const res = await client.query('SELECT NOW()');
        console.log('Create time:', res.rows[0]);
        client.release();
        process.exit(0);
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
        process.exit(1);
    }
}

test();
