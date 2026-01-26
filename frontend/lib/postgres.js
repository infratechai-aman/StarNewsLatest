import { Pool } from 'pg'

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

// Initialize tables
export async function initDB() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'registered',
        status VARCHAR(50) DEFAULT 'active',
        profile_image TEXT,
        phone VARCHAR(50),
        address TEXT,
        require_password_change BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS news_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        name_hi VARCHAR(255),
        name_mr VARCHAR(255),
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS news_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT,
        category_id UUID REFERENCES news_categories(id),
        city VARCHAR(255),
        genre VARCHAR(100) DEFAULT 'breaking',
        main_image TEXT,
        gallery_images JSONB DEFAULT '[]',
        video_url TEXT,
        youtube_url TEXT,
        is_livestream BOOLEAN DEFAULT false,
        livestream_url TEXT,
        tags JSONB DEFAULT '[]',
        meta_description TEXT,
        author_id UUID REFERENCES users(id),
        approval_status VARCHAR(50) DEFAULT 'draft',
        featured BOOLEAN DEFAULT false,
        views INTEGER DEFAULT 0,
        rejection_reason TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        address TEXT,
        city VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        website TEXT,
        image TEXT,
        owner_id UUID REFERENCES users(id),
        approval_status VARCHAR(50) DEFAULT 'pending',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS classified_ads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        price DECIMAL(10,2),
        contact_name VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        location VARCHAR(255),
        images JSONB DEFAULT '[]',
        approval_status VARCHAR(50) DEFAULT 'pending',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS enewspapers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        pdf_url TEXT NOT NULL,
        publish_date DATE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reporter_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        experience TEXT,
        portfolio TEXT,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        admin_note TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_promotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        description TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        admin_note TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('PostgreSQL tables initialized')
  } finally {
    client.release()
  }
}

export async function query(text, params) {
  const result = await pool.query(text, params)
  return result
}

export { pool }
export default pool
