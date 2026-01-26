const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const connectionString = process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews';
const pool = new Pool({ connectionString });

const businessImages = [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
    'https://images.unsplash.com/photo-1526304640152-d4619684e484',
    'https://images.unsplash.com/photo-1507679799987-975514f7b607'
];

const nationalImages = [
    'https://images.unsplash.com/photo-1532375810709-75b1da00537c',
    'https://images.unsplash.com/photo-1596386461350-326ea75b32f5',
    'https://images.unsplash.com/photo-1512413914633-b5043f4041ea'
];

const businessTitles = [
    "Stock Market Hits All-Time High Amidst Reforms",
    "Major Merger Announced Between Tech Giants",
    "Startup Ecosystem Sees 20% Growth in Q1",
    "New Policy to Boost Small Business Sector",
    "Global Markets React to Economic Shifts"
];

const nationalTitles = [
    "Parliament Passes Landmark Education Bill",
    "PM Inaugurates New Infrastructure Project",
    "National Health Scheme Expanded to Rural Areas",
    "ISRO Announces New Space Mission Launch Date",
    "Diplomatic Talks Yield Positive Results at Summit"
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    const client = await pool.connect();
    console.log('Connected to database...');

    try {
        // 1. Ensure Categories Exist
        let businessCatId, nationalCatId;

        // BUSINESS
        let res = await client.query("SELECT id FROM news_categories WHERE name = 'Business'");
        if (res.rows.length === 0) {
            console.log('Creating Business category...');
            const id = uuidv4();
            await client.query("INSERT INTO news_categories (id, name, slug, active) VALUES ($1, 'Business', 'business', true)", [id]);
            businessCatId = id;
        } else {
            businessCatId = res.rows[0].id;
        }

        // NATIONAL
        res = await client.query("SELECT id FROM news_categories WHERE name = 'National'");
        if (res.rows.length === 0) {
            console.log('Creating National category...');
            const id = uuidv4();
            await client.query("INSERT INTO news_categories (id, name, slug, active) VALUES ($1, 'National', 'national', true)", [id]);
            nationalCatId = id;
        } else {
            nationalCatId = res.rows[0].id;
        }

        // 2. Get Author
        res = await client.query('SELECT id FROM users LIMIT 1');
        const authorId = res.rows.length > 0 ? res.rows[0].id : null;
        if (!authorId) { console.error('No users found!'); return; }

        // 3. Insert Business News
        console.log('Inserting Business news...');
        for (let i = 0; i < 10; i++) {
            const title = getRandomElement(businessTitles) + ` ${i + 1}`;
            await client.query(`
            INSERT INTO news_articles (
                id, title, content, category_id, city, main_image, thumbnail_url,
                author_id, approval_status, created_at, published_at, active, featured, views
            ) VALUES ($1, $2, $3, $4, 'Mumbai', $5, $5, $6, 'approved', NOW(), NOW(), true, $7, $8)
        `, [
                uuidv4(),
                title,
                `Mock content for ${title}.`,
                businessCatId,
                getRandomElement(businessImages),
                authorId,
                Math.random() > 0.7,
                Math.floor(Math.random() * 5000)
            ]);
        }

        // 4. Insert National News
        console.log('Inserting National news...');
        for (let i = 0; i < 10; i++) {
            const title = getRandomElement(nationalTitles) + ` ${i + 1}`;
            await client.query(`
            INSERT INTO news_articles (
                id, title, content, category_id, city, main_image, thumbnail_url,
                author_id, approval_status, created_at, published_at, active, featured, views
            ) VALUES ($1, $2, $3, $4, 'Delhi', $5, $5, $6, 'approved', NOW(), NOW(), true, $7, $8)
        `, [
                uuidv4(),
                title,
                `Mock content for ${title}.`,
                nationalCatId,
                getRandomElement(nationalImages),
                authorId,
                Math.random() > 0.7,
                Math.floor(Math.random() * 5000)
            ]);
        }

        console.log('Success! Business and National categories populated.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedData();
