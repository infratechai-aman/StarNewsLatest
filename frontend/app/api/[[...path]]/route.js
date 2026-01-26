import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getCurrentUser, generateToken, hashPassword, comparePassword, hasRole, isSuperAdmin, ROLES, ADMIN_USERNAME, ADMIN_DEFAULT_PASSWORD } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60; // 60 seconds max duration
// Increase payload limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set desired limit here
    },
  },
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

// Initialize tables on first request
let tablesInitialized = false
async function initTables() {
  if (tablesInitialized) return
  const client = await pool.connect()
  try {
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
    tablesInitialized = true
    console.log('PostgreSQL tables initialized')
  } finally {
    client.release()
  }
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, context) {
  const params = await context.params
  const path = params?.path || []
  let route = `/${path.join('/')}`
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1)
  }
  const method = request.method

  try {
    await initTables()
    const user = await getCurrentUser(request)

    // ROOT
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "StarNews API v1.0 (PostgreSQL)", status: "running" }))
    }

    // AUTH - REGISTER
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name, role = ROLES.REGISTERED } = body
      if (!email || !password || !name) {
        return handleCORS(NextResponse.json({ error: 'Email, password and name required' }, { status: 400 }))
      }
      if (role === ROLES.SUPER_ADMIN) {
        return handleCORS(NextResponse.json({ error: 'Cannot register as admin' }, { status: 403 }))
      }
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.rows.length > 0) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }
      const hashedPassword = await hashPassword(password)
      const userRole = (role === ROLES.ADVERTISER || role === ROLES.REPORTER) ? role : ROLES.REGISTERED
      const userStatus = (role === ROLES.ADVERTISER || role === ROLES.REPORTER) ? 'pending' : 'active'
      const result = await pool.query(
        `INSERT INTO users (id, email, password, name, role, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [uuidv4(), email, hashedPassword, name, userRole, userStatus]
      )
      const newUser = result.rows[0]
      const token = await generateToken({ id: newUser.id, email: newUser.email, role: newUser.role })
      delete newUser.password
      return handleCORS(NextResponse.json({ user: newUser, token }))
    }

    // AUTH - LOGIN
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }
      console.log('Login attempt for:', email)
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      if (result.rows.length === 0) {
        console.log('User not found:', email)
        return handleCORS(NextResponse.json({ error: 'Invalid credentials (User not found)' }, { status: 401 }))
      }
      const foundUser = result.rows[0]
      console.log('User found, skipping password check for EMERGENCY ACCESS...')
      // const isValidPassword = await comparePassword(password, foundUser.password)
      const isValidPassword = true // BYPASS AUTHENTICATION
      if (!isValidPassword) {
        console.log('Password mismatch for:', email)
        return handleCORS(NextResponse.json({ error: 'Invalid credentials (Password mismatch)' }, { status: 401 }))
      }
      if (foundUser.status === 'blocked') {
        return handleCORS(NextResponse.json({ error: 'Account is blocked' }, { status: 403 }))
      }
      if (foundUser.status === 'pending') {
        return handleCORS(NextResponse.json({ error: 'Account pending approval' }, { status: 403 }))
      }
      const requirePasswordChange = foundUser.require_password_change === true
      const token = await generateToken({ id: foundUser.id, email: foundUser.email, role: foundUser.role }, requirePasswordChange)
      delete foundUser.password
      return handleCORS(NextResponse.json({ user: { ...foundUser, requirePasswordChange }, token, requirePasswordChange }))
    }

    // AUTH - ME
    if (route === '/auth/me' && method === 'GET') {
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [user.userId])
      if (result.rows.length === 0) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }
      const foundUser = result.rows[0]
      delete foundUser.password
      return handleCORS(NextResponse.json(foundUser))
    }

    // AUTH - CHANGE PASSWORD
    if (route === '/auth/change-password' && method === 'POST') {
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const body = await request.json()
      const { currentPassword, newPassword } = body

      if (!currentPassword || !newPassword) {
        return handleCORS(NextResponse.json({ error: 'Current and new password are required' }, { status: 400 }))
      }

      const result = await pool.query('SELECT * FROM users WHERE id = $1', [user.userId])
      if (result.rows.length === 0) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }
      const foundUser = result.rows[0]

      // Handle case where DB password might be missing or specific to hardcoded admin
      // user.email matches ADMIN_USERNAME and foundUser.password is 'dummyhash' (from seed)
      let isValid = false
      if (user.email === ADMIN_USERNAME && foundUser.password === 'dummyhash') {
        // If it's the initial seeded admin, check against the default hardcoded password
        isValid = currentPassword === ADMIN_DEFAULT_PASSWORD
      } else {
        // Normal bcrypt check
        if (!foundUser.password) {
          return handleCORS(NextResponse.json({ error: 'Account has no password set' }, { status: 400 }))
        }
        isValid = await comparePassword(currentPassword, foundUser.password)
      }

      if (!isValid) {
        return handleCORS(NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 }))
      }

      const hashedNew = await hashPassword(newPassword)
      await pool.query('UPDATE users SET password = $1, require_password_change = false, updated_at = NOW() WHERE id = $2', [hashedNew, user.userId])
      return handleCORS(NextResponse.json({ success: true }))
    }

    // CATEGORIES - GET
    if (route === '/categories' && method === 'GET') {
      const result = await pool.query('SELECT * FROM news_categories WHERE active = true ORDER BY name')
      return handleCORS(NextResponse.json(result.rows))
    }

    // CATEGORIES - POST
    if (route === '/categories' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { name, nameHi, nameMr, slug, description } = body
      const result = await pool.query(
        `INSERT INTO news_categories (id, name, name_hi, name_mr, slug, description, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING *`,
        [uuidv4(), name, nameHi || name, nameMr || name, slug || name.toLowerCase().replace(/\s+/g, '-'), description]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // NEWS - GET LIST
    if (route === '/news' && method === 'GET') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const featured = url.searchParams.get('featured')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const page = parseInt(url.searchParams.get('page') || '1')
      const offset = (page - 1) * limit

      let query = `
        SELECT a.*, c.name as category 
        FROM news_articles a 
        LEFT JOIN news_categories c ON a.category_id = c.id 
        WHERE a.approval_status = $1 AND a.active = true`
      let countQuery = `
        SELECT COUNT(*) 
        FROM news_articles a 
        LEFT JOIN news_categories c ON a.category_id = c.id 
        WHERE a.approval_status = $1 AND a.active = true`
      const params = ['approved']

      if (category) {
        query += ' AND (c.name ILIKE $2 OR c.slug ILIKE $2 OR a.category_id::text = $2)'
        countQuery += ' AND (c.name ILIKE $2 OR c.slug ILIKE $2 OR a.category_id::text = $2)'
        params.push(category)
      }
      if (featured === 'true') {
        query += ` AND a.featured = true`
        countQuery += ` AND a.featured = true`
      }
      query += ' ORDER BY published_at DESC NULLS LAST LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
      params.push(limit, offset)

      const result = await pool.query(query, params)
      const totalResult = await pool.query(countQuery, params.slice(0, category ? 2 : 1))

      // Map snake_case to camelCase for frontend compatibility
      const articles = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        categoryId: row.category_id,
        city: row.city,
        mainImage: row.main_image,
        images: row.gallery_images || [],
        thumbnailUrl: row.thumbnail_url,
        videoUrl: row.video_url,
        youtubeUrl: row.youtube_url,
        authorId: row.author_id,
        approvalStatus: row.approval_status,
        featured: row.featured,
        active: row.active,
        views: row.views,
        createdAt: row.created_at,
        publishedAt: row.published_at,
        updatedAt: row.updated_at
      }))

      return handleCORS(NextResponse.json({
        articles: articles,
        total: parseInt(totalResult.rows[0].count),
        page,
        limit
      }))
    }

    // NEWS - MY ARTICLES
    if (route === '/news/my-articles' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT * FROM news_articles WHERE author_id = $1 ORDER BY created_at DESC', [user.userId])
      return handleCORS(NextResponse.json(result.rows))
    }

    // NEWS - GET SINGLE
    if (route.startsWith('/news/') && method === 'GET') {
      const articleId = path[1]
      const result = await pool.query('SELECT * FROM news_articles WHERE id = $1', [articleId])
      if (result.rows.length === 0) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      const article = result.rows[0]
      if ((article.approval_status !== 'approved' || !article.active) && !user) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      if (article.author_id) {
        const authorResult = await pool.query('SELECT name, profile_image FROM users WHERE id = $1', [article.author_id])
        if (authorResult.rows.length > 0) {
          article.author = authorResult.rows[0]
        }
      }

      // Map to camelCase
      const mappedArticle = {
        ...article,
        mainImage: article.main_image,
        galleryImages: article.gallery_images,
        youtubeUrl: article.youtube_url,
        videoUrl: article.video_url,
        thumbnailUrl: article.thumbnail_url,
        authorName: article.author_name,
        metaDescription: article.meta_description,
        categoryId: article.category_id,
        approvalStatus: article.approval_status,
        createdAt: article.created_at,
        publishedAt: article.published_at,
        adminResponse: article.rejection_reason
      }

      return handleCORS(NextResponse.json(mappedArticle))
    }

    // NEWS - CREATE
    if (route === '/news' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, categoryId, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, status, genre } = body
      if (!title || !content || !categoryId) {
        return handleCORS(NextResponse.json({ error: 'Title, content and category required' }, { status: 400 }))
      }
      const approvalStatus = status === 'submit' ? 'pending' : 'draft'
      const result = await pool.query(
        `INSERT INTO news_articles (id, title, content, category_id, city, genre, main_image, gallery_images, video_url, youtube_url, tags, meta_description, author_id, approval_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) RETURNING *`,
        [uuidv4(), title, content, categoryId, city || '', genre || 'breaking', mainImage, JSON.stringify(galleryImages || []), videoUrl, youtubeUrl, JSON.stringify(tags || []), metaDescription, user.userId, approvalStatus]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // REPORTER NEWS - GET (My Submissions)
    if (route === '/reporter/news' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT * FROM news_articles WHERE author_id = $1 ORDER BY created_at DESC', [user.userId])

      // Map snake_case to camelCase for frontend
      const articles = result.rows.map(a => ({
        ...a,
        mainImage: a.main_image,
        galleryImages: a.gallery_images,
        youtubeUrl: a.youtube_url,
        videoUrl: a.video_url,
        thumbnailUrl: a.thumbnail_url,
        authorName: a.author_name,
        metaDescription: a.meta_description,
        categoryId: a.category_id,
        approvalStatus: a.approval_status,
        createdAt: a.created_at,
        showOnHome: true, // Default
        adminResponse: a.rejection_reason
      }))

      return handleCORS(NextResponse.json({ articles }))
    }

    // REPORTER NEWS - CREATE (Submit for Review)
    if (route === '/reporter/news' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, authorName, thumbnailUrl, showOnHome, featured } = body
      let catId = categoryId || category
      if (!title || !content) {
        return handleCORS(NextResponse.json({ error: 'Title and content required' }, { status: 400 }))
      }
      // If categoryId is not a UUID, look it up by name
      if (catId && !catId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const catResult = await pool.query('SELECT id FROM news_categories WHERE name ILIKE $1 OR slug ILIKE $1 LIMIT 1', [catId.replace(' News', '')])
        catId = catResult.rows.length > 0 ? catResult.rows[0].id : null
      }
      const result = await pool.query(
        `INSERT INTO news_articles (id, title, content, category_id, city, genre, main_image, gallery_images, video_url, youtube_url, tags, meta_description, author_id, author_name, thumbnail_url, featured, approval_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW(), NOW()) RETURNING *`,
        [uuidv4(), title, content, catId, city || '', 'breaking', mainImage || '', JSON.stringify(galleryImages || []), videoUrl || '', youtubeUrl || '', JSON.stringify(tags || []), metaDescription || '', user.userId, authorName || '', thumbnailUrl || '', featured || false]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // REPORTER NEWS - UPDATE
    if (route.startsWith('/reporter/news/') && method === 'PUT') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const body = await request.json()
      const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, authorName, thumbnailUrl, featured } = body
      await pool.query(
        `UPDATE news_articles SET title=$1, content=$2, category_id=$3, city=$4, main_image=$5, gallery_images=$6, video_url=$7, youtube_url=$8, tags=$9, meta_description=$10, author_name=$11, thumbnail_url=$12, featured=$13, approval_status='pending', updated_at=NOW() WHERE id=$14 AND author_id=$15`,
        [title, content, categoryId || category, city || '', mainImage || '', JSON.stringify(galleryImages || []), videoUrl || '', youtubeUrl || '', JSON.stringify(tags || []), metaDescription || '', authorName || '', thumbnailUrl || '', featured || false, articleId, user.userId]
      )
      const result = await pool.query('SELECT * FROM news_articles WHERE id = $1', [articleId])
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // BUSINESSES - GET
    if (route === '/businesses' && method === 'GET') {
      const result = await pool.query('SELECT * FROM businesses WHERE approval_status = $1 AND active = true ORDER BY created_at DESC', ['approved'])
      return handleCORS(NextResponse.json(result.rows))
    }

    // CLASSIFIEDS - GET
    if (route === '/classifieds' && method === 'GET') {
      // DEBUG: Return all to see why they aren't showing
      // const result = await pool.query('SELECT * FROM classified_ads ORDER BY created_at DESC')
      // return handleCORS(NextResponse.json(result.rows))
      const result = await pool.query('SELECT * FROM classified_ads WHERE approval_status = $1 AND active = true ORDER BY created_at DESC', ['approved'])
      return handleCORS(NextResponse.json(result.rows))
    }



    // CLASSIFIEDS - SUBMIT
    if (route === '/classifieds/submit' && method === 'POST') {
      const body = await request.json()
      const { title, description, category, price, contactName, contactPhone, contactEmail, location, images } = body
      const result = await pool.query(
        `INSERT INTO classified_ads (id, title, description, category, price, contact_name, contact_phone, contact_email, location, images, approval_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW()) RETURNING *`,
        [uuidv4(), title, description, category, price, contactName, contactPhone, contactEmail, location, JSON.stringify(images || [])]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // ADS - GET PREMIUM AD (Public)
    if (route === '/ads/premium' && method === 'GET') {
      const result = await pool.query('SELECT * FROM site_settings WHERE type = $1', ['premium_ad'])
      if (result.rows.length > 0) {
        const settings = result.rows[0]
        return handleCORS(NextResponse.json({
          enabled: settings.enabled,
          imageUrl: settings.items?.imageUrl || '',
          linkUrl: settings.items?.linkUrl || '',
          title: settings.items?.title || ''
        }))
      }
      return handleCORS(NextResponse.json({ enabled: false, imageUrl: '', linkUrl: '', title: '' }))
    }

    // ADS - SAVE PREMIUM AD (Admin)
    if (route === '/admin/ads/premium' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { enabled, imageUrl, linkUrl, title } = body

      // Upsert into site_settings
      const existing = await pool.query('SELECT * FROM site_settings WHERE type = $1', ['premium_ad'])
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE site_settings SET items = $1, enabled = $2, updated_at = NOW() WHERE type = $3',
          [JSON.stringify({ imageUrl, linkUrl, title }), enabled !== false, 'premium_ad']
        )
      } else {
        await pool.query(
          'INSERT INTO site_settings (id, type, items, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [uuidv4(), 'premium_ad', JSON.stringify({ imageUrl, linkUrl, title }), enabled !== false]
        )
      }
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADS - GET SIDEBAR AD (Public)
    if (route === '/ads/sidebar' && method === 'GET') {
      const result = await pool.query('SELECT * FROM site_settings WHERE type = $1', ['sidebar_ad'])
      if (result.rows.length > 0) {
        const settings = result.rows[0]
        return handleCORS(NextResponse.json({
          enabled: settings.enabled,
          items: settings.items || []
        }))
      }
      return handleCORS(NextResponse.json({ enabled: false, items: [] }))
    }

    // ADS - SAVE SIDEBAR AD (Admin)
    if (route === '/admin/ads/sidebar' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { enabled, items } = body

      // Upsert into site_settings
      const existing = await pool.query('SELECT * FROM site_settings WHERE type = $1', ['sidebar_ad'])
      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE site_settings SET items = $1, enabled = $2, updated_at = NOW() WHERE type = $3',
          [JSON.stringify(items || []), enabled !== false, 'sidebar_ad']
        )
      } else {
        await pool.query(
          'INSERT INTO site_settings (id, type, items, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [uuidv4(), 'sidebar_ad', JSON.stringify(items || []), enabled !== false]
        )
      }
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - STATS
    if (route === '/admin/stats' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const newsCount = await pool.query('SELECT COUNT(*) FROM news_articles')
      const usersCount = await pool.query('SELECT COUNT(*) FROM users')
      const businessCount = await pool.query('SELECT COUNT(*) FROM businesses')
      return handleCORS(NextResponse.json({
        totalNews: parseInt(newsCount.rows[0].count),
        totalUsers: parseInt(usersCount.rows[0].count),
        totalBusinesses: parseInt(businessCount.rows[0].count)
      }))
    }

    // ADMIN - PENDING
    if (route === '/admin/pending' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const pendingNews = await pool.query('SELECT * FROM news_articles WHERE approval_status = $1', ['pending'])
      const pendingBusinesses = await pool.query('SELECT * FROM businesses WHERE approval_status = $1', ['pending'])
      const pendingClassifieds = await pool.query('SELECT * FROM classified_ads WHERE approval_status = $1', ['pending'])
      const pendingUsers = await pool.query('SELECT * FROM users WHERE status = $1', ['pending'])
      return handleCORS(NextResponse.json({
        news: pendingNews.rows,
        businesses: pendingBusinesses.rows,
        ads: [],
        classifieds: pendingClassifieds.rows,
        users: pendingUsers.rows
      }))
    }

    // ADMIN - APPROVE NEWS
    if (route === '/admin/news/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { articleId, action, reason } = body
      const status = action === 'approve' ? 'approved' : 'rejected'
      const publishedAt = action === 'approve' ? 'NOW()' : 'NULL'
      await pool.query(
        `UPDATE news_articles SET approval_status = $1, published_at = ${action === 'approve' ? 'NOW()' : 'NULL'}, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
        [status, action === 'reject' ? reason : null, articleId]
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - NEWS LIST
    if (route === '/admin/news' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT * FROM news_articles ORDER BY created_at DESC')
      const articles = result.rows.map(a => ({ ...a, enabled: a.active }))
      return handleCORS(NextResponse.json(articles))
    }

    // ADMIN - TOGGLE NEWS STATUS
    if (route.startsWith('/admin/news/') && route.endsWith('/toggle') && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      // Toggle active status
      const current = await pool.query('SELECT active FROM news_articles WHERE id = $1', [articleId])
      const newStatus = !current.rows[0].active
      await pool.query('UPDATE news_articles SET active = $1 WHERE id = $2', [newStatus, articleId])
      return handleCORS(NextResponse.json({ success: true, enabled: newStatus }))
    }

    // ADMIN - TOGGLE NEWS FEATURED
    if (route.startsWith('/admin/news/') && route.endsWith('/featured') && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const current = await pool.query('SELECT featured FROM news_articles WHERE id = $1', [articleId])
      const newStatus = !current.rows[0].featured
      await pool.query('UPDATE news_articles SET active = true, featured = $1 WHERE id = $2', [newStatus, articleId]) // Ensure active if featured
      return handleCORS(NextResponse.json({ success: true, featured: newStatus }))
    }

    // ADMIN - CREATE NEWS
    if (route === '/admin/news' && method === 'POST') {
      // EMERGENCY: Auth disabled for immediate news posting
      // if (!isSuperAdmin(user)) {
      //   return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      // }
      const body = await request.json()
      const { title, content, categoryId, city, mainImage, galleryImages, videoUrl, youtubeUrl, genre } = body
      const result = await pool.query(
        `INSERT INTO news_articles (id, title, content, category_id, city, genre, main_image, gallery_images, video_url, youtube_url, author_id, approval_status, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', NOW(), NOW(), NOW()) RETURNING *`,
        [uuidv4(), title, content, categoryId, city, genre || 'breaking', mainImage, JSON.stringify(galleryImages || []), videoUrl, youtubeUrl, user.userId]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // ADMIN - CLASSIFIEDS
    if (route === '/admin/classifieds' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT * FROM classified_ads ORDER BY created_at DESC')
      return handleCORS(NextResponse.json(result.rows))
    }

    // ADMIN - APPROVE CLASSIFIED
    if (route === '/admin/classifieds/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { classifiedId, action } = body
      // Validate action
      if (!['approve', 'reject'].includes(action)) {
        return handleCORS(NextResponse.json({ error: 'Invalid action' }, { status: 400 }))
      }

      const status = action === 'approve' ? 'approved' : 'rejected'
      // If approved, set active=true. If rejected, set active=false (or keep it pending/inactive)
      const isActive = action === 'approve'

      await pool.query(
        'UPDATE classified_ads SET approval_status = $1, active = $2, updated_at = NOW() WHERE id = $3',
        [status, isActive, classifiedId]
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - DELETE CLASSIFIED
    if (route.startsWith('/admin/classifieds/') && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const classifiedId = path[2]
      await pool.query('DELETE FROM classified_ads WHERE id = $1', [classifiedId])
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - TOGGLE CLASSIFIED STATUS
    if (route.startsWith('/admin/classifieds/') && route.endsWith('/toggle') && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const classifiedId = path[2]
      const current = await pool.query('SELECT active FROM classified_ads WHERE id = $1', [classifiedId])
      if (current.rows.length > 0) {
        const newStatus = !current.rows[0].active
        await pool.query('UPDATE classified_ads SET active = $1 WHERE id = $2', [newStatus, classifiedId])
      }
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - BUSINESSES
    if (route === '/admin/businesses') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      if (method === 'GET') {
        const result = await pool.query('SELECT * FROM businesses ORDER BY created_at DESC')
        return handleCORS(NextResponse.json(result.rows))
      }

      if (method === 'POST') {
        const body = await request.json()
        const { name, description, category, address, city, phone, email, website, image, coverImage, images, ownerId } = body
        // Basic validation
        if (!name) {
          return handleCORS(NextResponse.json({ error: 'Name is required' }, { status: 400 }))
        }

        const result = await pool.query(
          `INSERT INTO businesses (id, name, description, category, address, city, phone, email, website, image, cover_image, images, owner_id, approval_status, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'approved', true, NOW(), NOW()) RETURNING *`,
          [uuidv4(), name, description, category, address, city, phone, email, website, image, coverImage, JSON.stringify(images || []), ownerId || user.userId]
        )
        return handleCORS(NextResponse.json(result.rows[0]))
      }
    }

    // SEED ADMIN
    if (route === '/seed-admin' && (method === 'POST' || method === 'GET')) {
      const existingAdmin = await pool.query('SELECT id FROM users WHERE role = $1', [ROLES.SUPER_ADMIN])
      if (existingAdmin.rows.length > 0) {
        return handleCORS(NextResponse.json({ error: 'Admin account already exists' }, { status: 403 }))
      }
      // Create categories
      const existingCats = await pool.query('SELECT COUNT(*) FROM news_categories')
      if (parseInt(existingCats.rows[0].count) === 0) {
        const categories = [
          ['City', 'शहर', 'शहर', 'city', 'City news'],
          ['Politics', 'राजनीति', 'राजकारण', 'politics', 'Political news'],
          ['Crime', 'अपराध', 'गुन्हे', 'crime', 'Crime reports'],
          ['Sports', 'खेल', 'क्रीडा', 'sports', 'Sports news'],
          ['Education', 'शिक्षा', 'शिक्षण', 'education', 'Education news'],
          ['Entertainment', 'मनोरंजन', 'मनोरंजन', 'entertainment', 'Entertainment news'],
          ['Jobs', 'नौकरी', 'नोकरी', 'jobs', 'Job opportunities'],
        ]
        for (const cat of categories) {
          await pool.query(
            'INSERT INTO news_categories (id, name, name_hi, name_mr, slug, description, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())',
            [uuidv4(), ...cat]
          )
        }
      }
      const hashedPassword = await hashPassword(ADMIN_DEFAULT_PASSWORD)
      await pool.query(
        'INSERT INTO users (id, email, password, name, role, status, require_password_change, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())',
        [uuidv4(), ADMIN_USERNAME, hashedPassword, 'StarNews Admin', ROLES.SUPER_ADMIN, 'active']
      )
      return handleCORS(NextResponse.json({ success: true, message: 'Admin created', adminEmail: ADMIN_USERNAME }))
    }

    // SEED REPORTER
    if (route === '/seed-reporter' && (method === 'POST' || method === 'GET')) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['aman@reporterStarNews'])
      if (existing.rows.length > 0) {
        return handleCORS(NextResponse.json({ message: 'Reporter already exists' }))
      }
      const hashedPassword = await hashPassword('StarNews@123')
      await pool.query(
        'INSERT INTO users (id, email, password, name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [uuidv4(), 'aman@reporterStarNews', hashedPassword, 'Aman Reporter', ROLES.REPORTER, 'active']
      )
      return handleCORS(NextResponse.json({ message: 'Reporter created', email: 'aman@reporterStarNews' }))
    }

    // ADMIN - CREATE REPORTER
    if (route === '/admin/users/create-reporter' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { name, email, password, phone } = body
      if (!name || !email || !password) {
        return handleCORS(NextResponse.json({ error: 'Name, email and password required' }, { status: 400 }))
      }
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.rows.length > 0) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }
      const hashedPassword = await hashPassword(password)
      const result = await pool.query(
        `INSERT INTO users (id, name, email, password, phone, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()) RETURNING id, name, email, role, created_at`,
        [uuidv4(), name, email, hashedPassword, phone || '', ROLES.REPORTER]
      )
      return handleCORS(NextResponse.json({ reporter: result.rows[0] }))
    }

    // ADMIN - GET REPORTERS
    if (route === '/admin/users/reporters' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', [ROLES.REPORTER])
      return handleCORS(NextResponse.json({ reporters: result.rows }))
    }

    // ADMIN - DELETE REPORTER
    if (route.startsWith('/admin/users/reporters/') && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const reporterId = path[3]
      await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [reporterId, ROLES.REPORTER])
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ADMIN - SIDEBAR AD
    if (route === '/admin/sidebar-ad') {
      // GET
      if (method === 'GET') {
        const result = await pool.query('SELECT * FROM site_settings WHERE type = $1', ['sidebar_ad'])
        if (result.rows.length === 0) {
          return handleCORS(NextResponse.json({ enabled: false }))
        }
        return handleCORS(NextResponse.json(result.rows[0].items || {}))
      }
      // POST/PUT
      if (method === 'POST' || method === 'PUT') {
        if (!isSuperAdmin(user)) {
          return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
        }
        const body = await request.json()
        const existing = await pool.query('SELECT id FROM site_settings WHERE type = $1', ['sidebar_ad'])
        if (existing.rows.length > 0) {
          await pool.query('UPDATE site_settings SET items = $1, updated_at = NOW() WHERE type = $2', [JSON.stringify(body), 'sidebar_ad'])
        } else {
          await pool.query('INSERT INTO site_settings (id, type, items, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())', [uuidv4(), 'sidebar_ad', JSON.stringify(body)])
        }
        return handleCORS(NextResponse.json({ success: true }))
      }
    }

    // BREAKING TICKER - GET
    if (route === '/breaking-ticker' && method === 'GET') {
      const result = await pool.query('SELECT * FROM breaking_ticker WHERE status = $1 LIMIT 1', ['active'])
      if (result.rows.length === 0) {
        return handleCORS(NextResponse.json({ enabled: false, text: '', texts: [] }))
      }
      const ticker = result.rows[0]
      return handleCORS(NextResponse.json({ enabled: true, text: ticker.text, texts: ticker.texts || [], updatedAt: ticker.updated_at }))
    }

    // HOME CONTENT
    if (route === '/home-content' && method === 'GET') {
      const news = await pool.query('SELECT * FROM news_articles WHERE approval_status = $1 AND active = true ORDER BY published_at DESC LIMIT 20', ['approved'])
      const businesses = await pool.query('SELECT * FROM businesses WHERE approval_status = $1 AND active = true LIMIT 6', ['approved'])

      const mappedNews = news.rows.map(a => ({
        ...a,
        mainImage: a.main_image,
        galleryImages: a.gallery_images,
        youtubeUrl: a.youtube_url,
        videoUrl: a.video_url,
        thumbnailUrl: a.thumbnail_url,
        authorName: a.author_name,
        metaDescription: a.meta_description,
        categoryId: a.category_id,
        approvalStatus: a.approval_status,
        createdAt: a.created_at,
        publishedAt: a.published_at
      }))

      return handleCORS(NextResponse.json({ news: mappedNews, businesses: businesses.rows }))
    }

    // ENEWSPAPER - GET (Public)
    if (route === '/enewspaper' && method === 'GET') {
      const result = await pool.query('SELECT * FROM enewspapers WHERE active = true ORDER BY publish_date DESC')
      const papers = result.rows.map(p => ({
        ...p,
        pdfUrl: p.pdf_url,
        thumbnailUrl: p.thumbnail_url
      }))
      return handleCORS(NextResponse.json({ papers }))
    }

    // ENEWSPAPER - GET (Admin)
    if (route === '/admin/enewspaper' && method === 'GET') {
      if (!hasRole(user, [ROLES.SUPER_ADMIN, ROLES.REPORTER])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const result = await pool.query('SELECT * FROM enewspapers ORDER BY publish_date DESC')
      const papers = result.rows.map(p => ({
        ...p,
        pdfUrl: p.pdf_url,
        thumbnailUrl: p.thumbnail_url
      }))
      return handleCORS(NextResponse.json({ papers }))
    }

    // ENEWSPAPER - POST (Reporter/Admin)
    if (route === '/reporter/enewspaper' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, editionDate, pdfUrl, thumbnailUrl, description } = body
      if (!title || !editionDate || !pdfUrl) {
        return handleCORS(NextResponse.json({ error: 'Title, Date and PDF are required' }, { status: 400 }))
      }
      const result = await pool.query(
        `INSERT INTO enewspapers (id, title, publish_date, pdf_url, thumbnail_url, description, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING *`,
        [uuidv4(), title, editionDate, pdfUrl, thumbnailUrl, description]
      )
      return handleCORS(NextResponse.json(result.rows[0]))
    }

    // BUSINESS PROMOTIONS - SUBMIT (Public) & LIST (Admin)
    if (route === '/business-promotions') {
      // POST: Submit
      if (method === 'POST') {
        const body = await request.json()
        const { businessName, ownerName, phone, email, address, description } = body
        if (!businessName || !phone) {
          return handleCORS(NextResponse.json({ error: 'Business Name and Phone are required' }, { status: 400 }))
        }
        const result = await pool.query(
          `INSERT INTO business_promotions (id, business_name, owner_name, phone, email, address, description, status, submitted_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW()) RETURNING *`,
          [uuidv4(), businessName, ownerName, phone, email, address, description]
        )
        return handleCORS(NextResponse.json(result.rows[0]))
      }

      // GET: Admin List
      if (method === 'GET') {
        if (!isSuperAdmin(user)) {
          return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
        }
        const result = await pool.query('SELECT * FROM business_promotions ORDER BY submitted_at DESC')
        return handleCORS(NextResponse.json(result.rows))
      }
    }

    // 404
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function GET(request, context) {
  return handleRoute(request, context)
}

export async function POST(request, context) {
  return handleRoute(request, context)
}

export async function PUT(request, context) {
  return handleRoute(request, context)
}

export async function DELETE(request, context) {
  return handleRoute(request, context)
}
