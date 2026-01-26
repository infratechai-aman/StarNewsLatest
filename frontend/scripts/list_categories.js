const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews';
const pool = new Pool({ connectionString });

async function listCategories() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT name FROM news_categories');
        console.log('Categories:', res.rows.map(r => r.name));
    } finally {
        client.release();
        pool.end();
    }
}

listCategories();
