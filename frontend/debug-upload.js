const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
    connectionString: 'postgresql://starnews:StarNews@2026!@31.97.60.66:5432/starnews',
    ssl: false
});

async function testUpload() {
    console.log('Connecting to DB...');
    try {
        const client = await pool.connect();
        console.log('Connected!');

        // 1. Check Table
        console.log('Checking if table "file_uploads" exists...');
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'file_uploads'
      );
    `);
        console.log('Table Exists:', tableCheck.rows[0].exists);

        if (!tableCheck.rows[0].exists) {
            console.log('Creating table...');
            await client.query(`
          CREATE TABLE IF NOT EXISTS file_uploads (
            id UUID PRIMARY KEY,
            filename TEXT,
            mime_type TEXT,
            data BYTEA,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
            console.log('Table created.');
        }

        // 2. Test Small Insert
        console.log('Testing Small Insert (1KB)...');
        const smallBuffer = Buffer.alloc(1024, 'a');
        await client.query(
            'INSERT INTO file_uploads (id, filename, mime_type, data) VALUES ($1, $2, $3, $4)',
            [uuidv4(), 'test-small.txt', 'text/plain', smallBuffer]
        );
        console.log('Small Insert SUCCESS.');

        // 3. Test Large Insert (6MB) - Simulating PDF
        console.log('Testing Large Insert (6MB)...');
        try {
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'b');
            const start = Date.now();
            await client.query(
                'INSERT INTO file_uploads (id, filename, mime_type, data) VALUES ($1, $2, $3, $4)',
                [uuidv4(), 'test-large.pdf', 'application/pdf', largeBuffer]
            );
            console.log(`Large Insert SUCCESS. Took ${Date.now() - start}ms`);
        } catch (err) {
            console.error('Large Insert FAILED:', err.message);
        }

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

testUpload();
