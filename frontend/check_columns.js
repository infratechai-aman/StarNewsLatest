const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://starnews:starnews123@localhost:5432/starnews'
});

async function test() {
    try {
        const client = await pool.connect();

        console.log('--- business_promotions ---');
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'business_promotions'");
        console.log(res.rows.map(r => r.column_name).join(', '));

        console.log('--- breaking_ticker ---');
        const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'breaking_ticker'");
        console.log(res2.rows.map(r => r.column_name).join(', '));

        client.release();
        process.exit(0);
    } catch (e) {
        console.error('Check Failed:', e.message);
        process.exit(1);
    }
}

test();
