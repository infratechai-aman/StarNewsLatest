const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// DB connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews';

const pool = new Pool({
    connectionString
});

const cities = [
    'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Hyderabad',
    'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur'
];

const mockTitles = [
    "New Development Project Announced in {city}",
    "Local {category} Summit Draws Huge Crowd",
    "Breaking: Major {category} Event to be Held in {city}",
    "Citizens of {city} Demand Better Infrastructure",
    "Top {category} Trends to Watch This Year",
    "Interview: {city} Mayor Discusses Future Plans",
    "Unexpected Turn of Events in the {category} World",
    "Why {city} is Becoming a Hub for {category}",
    "Daily Update: What's Happening in {city}",
    "Expert Analysis: The State of {category} in India"
];

const images = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e',
    'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3',
    'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9',
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    'https://images.unsplash.com/photo-1529243856184-485f9d0d83ac'
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    const client = await pool.connect();
    console.log('Connected to database...');

    try {
        // 1. Fetch or Create Categories
        let categoriesResult = await client.query('SELECT * FROM news_categories');
        let categories = categoriesResult.rows;

        if (categories.length === 0) {
            console.log('No categories found. Creating default categories...');
            const defaultCats = ['Politics', 'Business', 'Sports', 'Entertainment', 'City News', 'National'];
            for (const catName of defaultCats) {
                const insertRes = await client.query(
                    'INSERT INTO news_categories (id, name, slug) VALUES ($1, $2, $3) RETURNING *',
                    [uuidv4(), catName, catName.toLowerCase().replace(/ /g, '-')]
                );
                categories.push(insertRes.rows[0]);
            }
        } else {
            console.log(`Found ${categories.length} existing categories.`);
        }

        // 2. Fetch an Author (User)
        let usersResult = await client.query('SELECT id FROM users LIMIT 1');
        let authorId;
        if (usersResult.rows.length > 0) {
            authorId = usersResult.rows[0].id;
        } else {
            console.log('No users found. Creating a default admin user...');
            authorId = uuidv4();
            // Insert a dummy user if none exists (password hash is dummy)
            await client.query(
                "INSERT INTO users (id, email, password, name, role) VALUES ($1, 'admin@example.com', 'dummyhash', 'Admin', 'super_admin')",
                [authorId]
            );
        }

        // 3. Insert 50 Articles
        console.log('Inserting 50 news articles...');
        for (let i = 0; i < 50; i++) {
            const category = getRandomElement(categories); // This is the full category object
            const city = getRandomElement(cities);
            const titleTemplate = getRandomElement(mockTitles);
            const title = titleTemplate.replace('{city}', city).replace('{category}', category.name) + ` - ${i + 1}`;

            const articleId = uuidv4();
            const isFeatured = Math.random() > 0.8; // 20% displayed as featured

            const query = `
        INSERT INTO news_articles (
          id, title, content, category_id, city, 
          main_image, thumbnail_url, author_id, approval_status, 
          created_at, published_at, updated_at, 
          active, featured, views
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, 'approved', 
          NOW() - (random() * interval '30 days'), NOW() - (random() * interval '30 days'), NOW(), 
          true, $9, floor(random() * 5000)::int
        )
      `;

            const values = [
                articleId,
                title,
                `This is a mock article about ${title}. Lorem ipsum dolor sit amet.`,
                category.id, // ID from the category object
                city,
                getRandomElement(images), // main_image
                getRandomElement(images), // thumbnail_url
                authorId,
                isFeatured
            ];

            await client.query(query, values);
        }
        console.log('Successfully seeded 50 articles!');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedData();
