const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://starnews:starnews123@localhost:5432/starnews'
});

async function test() {
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT to_regclass('public.business_promotions')");
        console.log('business_promotions exists:', res.rows[0].to_regclass);

        const res2 = await client.query("SELECT to_regclass('public.breaking_ticker')");
        console.log('breaking_ticker exists:', res2.rows[0].to_regclass);

        client.release();
        process.exit(0);
    } catch (e) {
        console.error('Check Failed:', e.message);
        process.exit(1);
    }
}

test();
