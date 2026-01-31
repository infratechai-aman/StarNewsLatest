import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { isSuperAdmin, getCurrentUser } from '@/lib/auth'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const user = await getCurrentUser(request)
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const client = await pool.connect()
        try {
            console.log('Starting Migration...')

            // 1. Run original Schema DDL (Idempotent)
            await client.query(`
              ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_image TEXT;
              ALTER TABLE businesses ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
              ALTER TABLE enewspapers ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
              ALTER TABLE enewspapers ADD COLUMN IF NOT EXISTS description TEXT;
              ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_name TEXT;
              ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
              ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
        
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
                category_id UUID,
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
                author_id UUID,
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
                owner_id UUID,
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
                user_id UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
              );
              CREATE TABLE IF NOT EXISTS settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key VARCHAR(255) UNIQUE NOT NULL,
                value JSONB,
                updated_at TIMESTAMP DEFAULT NOW()
              );
              CREATE TABLE IF NOT EXISTS site_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type VARCHAR(255) UNIQUE NOT NULL,
                items JSONB,
                enabled BOOLEAN DEFAULT true,
                article_ids JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW(),
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
              CREATE TABLE IF NOT EXISTS breaking_ticker (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                text TEXT,
                texts JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'active',
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by VARCHAR(255)
              );
            `)
            console.log("Schema verified.")

            // 2. Add Performance Indexes
            console.log("Adding Indexes...")
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_news_approval ON news_articles(approval_status, active);
                CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category_id);
                CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
                CREATE INDEX IF NOT EXISTS idx_news_author ON news_articles(author_id);
                CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(approval_status, active);
                CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classified_ads(approval_status, active);
            `)
            console.log("Indexes applied.")

            return NextResponse.json({ success: true, message: "Migration and Indexing Complete" })
        } finally {
            client.release()
        }
    } catch (e) {
        console.error("Migration Failed:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
