import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getCurrentUser, generateToken, hashPassword, comparePassword, hasRole, isSuperAdmin, ROLES, ADMIN_USERNAME, ADMIN_DEFAULT_PASSWORD } from '@/lib/auth'

// Global connection cache for serverless (Next.js hot reload safe)
const globalForMongo = global
globalForMongo.mongoose = globalForMongo.mongoose || { conn: null, promise: null }

// Get MongoDB URL from environment variables (with fallback for local dev)
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://RiyazStarNews:MackbookStarNews@hussian.4hncquk.mongodb.net/starnews?retryWrites=true&w=majority'
const DB_NAME = process.env.DB_NAME || 'starnews'

/**
 * Connect to MongoDB using mongoose with proper TLS support
 * Prevents multiple connections in serverless environments
 * Uses global cache to survive Next.js hot reloads
 */
async function connectToMongo() {
  // Return cached connection if available
  if (globalForMongo.mongoose.conn) {
    return globalForMongo.mongoose.conn
  }

  // If connection is in progress, wait for it
  if (globalForMongo.mongoose.promise) {
    const conn = await globalForMongo.mongoose.promise
    return conn
  }

  if (!MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not defined')
  }

  // Start new connection
  console.log('Connecting to MongoDB Atlas with mongoose...')

  globalForMongo.mongoose.promise = mongoose.connect(MONGO_URL, {
    dbName: DB_NAME,
    // TLS/SSL options for cloud deployment
    tls: true,
    tlsAllowInvalidCertificates: false,
    // Write concern  
    retryWrites: true,
    w: 'majority',
    // Timeouts
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Connection pool
    maxPoolSize: 10,
    minPoolSize: 1,
  }).then((mongooseInstance) => {
    console.log('MongoDB connected successfully via mongoose')
    globalForMongo.mongoose.conn = mongooseInstance.connection.getClient().db(DB_NAME)
    return globalForMongo.mongoose.conn
  }).catch((error) => {
    console.error('MongoDB connection error:', error.message)
    globalForMongo.mongoose.promise = null
    throw new Error(`Database connection failed: ${error.message}`)
  })

  return globalForMongo.mongoose.promise
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
  // Normalize: remove trailing slash if present (unless root)
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1)
  }
  const method = request.method

  try {
    const db = await connectToMongo()
    const user = await getCurrentUser(request)

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Pune Majha API v1.0", status: "running" }))
    }

    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name, role = ROLES.REGISTERED } = body
      if (!email || !password || !name) {
        return handleCORS(NextResponse.json({ error: 'Email, password and name required' }, { status: 400 }))
      }
      // SECURITY: Prevent registration as super_admin
      if (role === ROLES.SUPER_ADMIN) {
        return handleCORS(NextResponse.json({ error: 'Cannot register as admin' }, { status: 403 }))
      }
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }
      const hashedPassword = await hashPassword(password)
      const newUser = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role: role === ROLES.ADVERTISER || role === ROLES.REPORTER ? role : ROLES.REGISTERED,
        status: (role === ROLES.ADVERTISER || role === ROLES.REPORTER) ? 'pending' : 'active',
        profileImage: null,
        phone: null,
        address: null,
        socialLinks: {
          instagram: null,
          youtube: null,
          facebook: null,
          twitter: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('users').insertOne(newUser)
      const token = await generateToken(newUser)
      const { password: _, ...userWithoutPassword } = newUser
      return handleCORS(NextResponse.json({ user: userWithoutPassword, token }))
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }
      const foundUser = await db.collection('users').findOne({ email })
      if (!foundUser) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      const isValidPassword = await comparePassword(password, foundUser.password)
      if (!isValidPassword) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      if (foundUser.status === 'blocked') {
        return handleCORS(NextResponse.json({ error: 'Account is blocked' }, { status: 403 }))
      }
      if (foundUser.status === 'pending') {
        return handleCORS(NextResponse.json({ error: 'Account pending approval' }, { status: 403 }))
      }
      // Check if password change is required (for first login)
      const requirePasswordChange = foundUser.requirePasswordChange === true
      const token = await generateToken(foundUser, requirePasswordChange)
      const { password: _, ...userWithoutPassword } = foundUser
      return handleCORS(NextResponse.json({
        user: { ...userWithoutPassword, requirePasswordChange },
        token,
        requirePasswordChange
      }))
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const foundUser = await db.collection('users').findOne({ id: user.userId })
      if (!foundUser) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }
      const { password: _, ...userWithoutPassword } = foundUser
      return handleCORS(NextResponse.json(userWithoutPassword))
    }

    if (route === '/categories' && method === 'GET') {
      const categories = await db.collection('news_categories').find({ active: true }).toArray()
      return handleCORS(NextResponse.json(categories))
    }

    if (route === '/categories' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { name, nameHi, nameMr, slug, description } = body
      const newCategory = {
        id: uuidv4(),
        name,
        nameHi: nameHi || name,
        nameMr: nameMr || name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        active: true,
        createdAt: new Date()
      }
      await db.collection('news_categories').insertOne(newCategory)
      return handleCORS(NextResponse.json(newCategory))
    }

    if (route === '/news' && method === 'GET') {
      const { category, featured, limit = 20, page = 1 } = Object.fromEntries(new URL(request.url).searchParams)
      const query = { approvalStatus: 'approved' }
      if (category) query.categoryId = category
      if (featured === 'true') query.featured = true
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const articles = await db.collection('news_articles').find(query).sort({ publishedAt: -1 }).skip(skip).limit(parseInt(limit)).toArray()
      const total = await db.collection('news_articles').countDocuments(query)
      return handleCORS(NextResponse.json({ articles, total, page: parseInt(page), limit: parseInt(limit) }))
    }

    if (route.startsWith('/news/') && method === 'GET') {
      const articleId = path[1]
      const article = await db.collection('news_articles').findOne({ id: articleId })
      if (!article) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      if (article.approvalStatus !== 'approved' && !user) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      const author = await db.collection('users').findOne({ id: article.authorId })
      if (author) {
        article.author = { name: author.name, profileImage: author.profileImage }
      }
      return handleCORS(NextResponse.json(article))
    }

    if (route === '/news' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, categoryId, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, status, genre, isLivestream, livestreamUrl } = body
      if (!title || !content || !categoryId) {
        return handleCORS(NextResponse.json({ error: 'Title, content and category required' }, { status: 400 }))
      }
      const newArticle = {
        id: uuidv4(),
        title,
        content,
        categoryId,
        city: city || '',
        genre: genre || 'breaking',
        mainImage,
        galleryImages: galleryImages || [],
        videoUrl,
        youtubeUrl,
        isLivestream: isLivestream || false,
        livestreamUrl: livestreamUrl || null,
        tags: tags || [],
        metaDescription,
        authorId: user.userId,
        approvalStatus: status === 'submit' ? 'pending' : 'draft',
        featured: false,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        rejectionReason: null
      }
      await db.collection('news_articles').insertOne(newArticle)
      return handleCORS(NextResponse.json(newArticle))
    }

    if (route.startsWith('/news/') && method === 'PUT') {
      const articleId = path[1]
      const article = await db.collection('news_articles').findOne({ id: articleId })
      if (!article) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      if (!isSuperAdmin(user)) {
        if (article.authorId !== user.userId) {
          return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
        }
        if (article.approvalStatus === 'approved') {
          return handleCORS(NextResponse.json({ error: 'Cannot edit approved article' }, { status: 403 }))
        }
      }
      const body = await request.json()
      const updates = { ...body, updatedAt: new Date() }
      if (body.status === 'submit' && article.approvalStatus === 'draft') {
        updates.approvalStatus = 'pending'
      }
      delete updates._id
      delete updates.id
      await db.collection('news_articles').updateOne({ id: articleId }, { $set: updates })
      const updatedArticle = await db.collection('news_articles').findOne({ id: articleId })
      return handleCORS(NextResponse.json(updatedArticle))
    }

    if (route === '/news/my-articles' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articles = await db.collection('news_articles').find({ authorId: user.userId }).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(articles))
    }

    if (route === '/admin/pending' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const pendingNews = await db.collection('news_articles').find({ approvalStatus: 'pending' }).toArray()
      const pendingBusinesses = await db.collection('businesses').find({ approvalStatus: 'pending' }).toArray()
      const pendingAds = await db.collection('advertisements').find({ approvalStatus: 'pending' }).toArray()
      const pendingClassifieds = await db.collection('classified_ads').find({ approvalStatus: 'pending' }).toArray()
      const pendingUsers = await db.collection('users').find({ status: 'pending' }).toArray()
      return handleCORS(NextResponse.json({ news: pendingNews, businesses: pendingBusinesses, ads: pendingAds, classifieds: pendingClassifieds, users: pendingUsers }))
    }

    if (route === '/admin/news/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { articleId, action, reason } = body
      const updates = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        publishedAt: action === 'approve' ? new Date() : null,
        rejectionReason: action === 'reject' ? reason : null,
        updatedAt: new Date()
      }
      await db.collection('news_articles').updateOne({ id: articleId }, { $set: updates })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Approve/Reject Business
    if (route === '/admin/businesses/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { businessId, action } = body
      const updates = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date()
      }
      await db.collection('businesses').updateOne({ id: businessId }, { $set: updates })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Approve/Reject Classified
    if (route === '/admin/classifieds/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { classifiedId, action } = body
      const updates = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        approvedAt: action === 'approve' ? new Date() : null,
        updatedAt: new Date()
      }
      await db.collection('classified_ads').updateOne({ id: classifiedId }, { $set: updates })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Approve/Reject Ad
    if (route === '/admin/ads/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { adId, action } = body
      const updates = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date()
      }
      await db.collection('advertisements').updateOne({ id: adId }, { $set: updates })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Approve/Reject User (Reporter)
    if (route === '/admin/users/approve' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { userId, action } = body
      const updates = {
        status: action === 'approve' ? 'active' : 'rejected',
        updatedAt: new Date()
      }
      await db.collection('users').updateOne({ id: userId }, { $set: updates })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Create Reporter Account
    if (route === '/admin/users/create-reporter' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { name, email, phone, password } = body

      if (!name || !email) {
        return handleCORS(NextResponse.json({ error: 'Name and email are required' }, { status: 400 }))
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User with this email already exists' }, { status: 400 }))
      }

      // Generate password if not provided
      const userPassword = password || 'Reporter@123'
      const hashedPassword = await hashPassword(userPassword)

      const newReporter = {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone || '',
        role: ROLES.REPORTER,
        status: 'active', // Directly active since admin is creating
        requirePasswordChange: true, // Force password change on first login
        profileImage: null,
        address: null,
        socialLinks: { instagram: null, youtube: null, facebook: null, twitter: null },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(newReporter)

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Reporter account created successfully',
        reporter: {
          id: newReporter.id,
          name: newReporter.name,
          email: newReporter.email,
          phone: newReporter.phone,
          temporaryPassword: userPassword
        }
      }))
    }

    // Admin: Get All Reporters
    if (route === '/admin/users/reporters' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const reporters = await db.collection('users').find({ role: ROLES.REPORTER }).sort({ createdAt: -1 }).toArray()
      // Remove password from response
      const safeReporters = reporters.map(({ password, ...rest }) => rest)
      return handleCORS(NextResponse.json({ reporters: safeReporters }))
    }

    // Admin: Delete Reporter
    if (route.match(/^\/admin\/users\/reporters\/[^/]+$/) && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const reporterId = path[3]
      const reporter = await db.collection('users').findOne({ id: reporterId, role: ROLES.REPORTER })
      if (!reporter) {
        return handleCORS(NextResponse.json({ error: 'Reporter not found' }, { status: 404 }))
      }
      await db.collection('users').deleteOne({ id: reporterId })
      return handleCORS(NextResponse.json({ success: true, message: 'Reporter deleted' }))
    }

    // Admin: Get/Update Breaking News Settings
    if (route === '/admin/breaking-news' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const settings = await db.collection('site_settings').findOne({ type: 'breaking_news' })
      return handleCORS(NextResponse.json(settings || { enabled: false, articleIds: [], text: '' }))
    }

    if (route === '/admin/breaking-news' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { enabled, articleIds, text } = body
      await db.collection('site_settings').updateOne(
        { type: 'breaking_news' },
        { $set: { enabled, articleIds: articleIds || [], text: text || '', updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin: Get/Update Navigation
    if (route === '/admin/navigation' && method === 'GET') {
      const settings = await db.collection('site_settings').findOne({ type: 'navigation' })
      return handleCORS(NextResponse.json(settings || { items: [] }))
    }

    if (route === '/admin/navigation' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { items } = body
      await db.collection('site_settings').updateOne(
        { type: 'navigation' },
        { $set: { items, updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Public: Get Breaking News for frontend display
    if (route === '/breaking-news' && method === 'GET') {
      const settings = await db.collection('site_settings').findOne({ type: 'breaking_news' })
      if (!settings || !settings.enabled) {
        return handleCORS(NextResponse.json({ enabled: false, items: [] }))
      }
      let items = []
      if (settings.text) {
        items.push({ text: settings.text })
      }
      if (settings.articleIds && settings.articleIds.length > 0) {
        const articles = await db.collection('news_articles').find({
          id: { $in: settings.articleIds },
          approvalStatus: 'approved'
        }).toArray()
        items = [...items, ...articles.map(a => ({ id: a.id, text: a.title }))]
      }
      return handleCORS(NextResponse.json({ enabled: true, items }))
    }

    // AUTH: Change Password endpoint (with old password verification)
    if (route === '/auth/change-password' && method === 'POST') {
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const body = await request.json()
      const { oldPassword, newPassword, confirmPassword } = body

      if (!oldPassword || !newPassword || !confirmPassword) {
        return handleCORS(NextResponse.json({ error: 'All password fields are required' }, { status: 400 }))
      }

      if (newPassword !== confirmPassword) {
        return handleCORS(NextResponse.json({ error: 'New passwords do not match' }, { status: 400 }))
      }

      if (newPassword.length < 8) {
        return handleCORS(NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 }))
      }

      const foundUser = await db.collection('users').findOne({ id: user.userId })
      if (!foundUser) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }

      const isValidOldPassword = await comparePassword(oldPassword, foundUser.password)
      if (!isValidOldPassword) {
        return handleCORS(NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 }))
      }

      const hashedNewPassword = await hashPassword(newPassword)
      await db.collection('users').updateOne(
        { id: user.userId },
        {
          $set: {
            password: hashedNewPassword,
            requirePasswordChange: false,
            updatedAt: new Date()
          }
        }
      )

      // Generate new token without requirePasswordChange
      const updatedUser = await db.collection('users').findOne({ id: user.userId })
      const newToken = await generateToken(updatedUser, false)
      const { password: _, ...userWithoutPassword } = updatedUser

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Password changed successfully',
        user: userWithoutPassword,
        token: newToken
      }))
    }

    // SEED: Initialize Admin Account (single admin only)
    if (route === '/seed-admin' && method === 'POST') {
      // Check if any admin already exists
      const existingAdmin = await db.collection('users').findOne({ role: ROLES.SUPER_ADMIN })
      if (existingAdmin) {
        return handleCORS(NextResponse.json({ error: 'Admin account already exists. Only one admin allowed.' }, { status: 403 }))
      }

      // Create categories if not exist
      const existingCategories = await db.collection('news_categories').countDocuments()
      if (existingCategories === 0) {
        const categories = [
          { id: uuidv4(), name: 'City', nameHi: 'शहर', nameMr: 'शहर', slug: 'city', description: 'City news and updates', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Politics', nameHi: 'राजनीति', nameMr: 'राजकारण', slug: 'politics', description: 'Political news', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Crime', nameHi: 'अपराध', nameMr: 'गुन्हे', slug: 'crime', description: 'Crime reports', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Sports', nameHi: 'खेल', nameMr: 'क्रीडा', slug: 'sports', description: 'Sports news', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Education', nameHi: 'शिक्षा', nameMr: 'शिक्षण', slug: 'education', description: 'Education news', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Entertainment', nameHi: 'मनोरंजन', nameMr: 'मनोरंजन', slug: 'entertainment', description: 'Entertainment news', active: true, createdAt: new Date() },
          { id: uuidv4(), name: 'Jobs', nameHi: 'नौकरी', nameMr: 'नोकरी', slug: 'jobs', description: 'Job opportunities', active: true, createdAt: new Date() },
        ]
        await db.collection('news_categories').insertMany(categories)
      }

      // Create the single admin account with requirePasswordChange = true
      const hashedPassword = await hashPassword(ADMIN_DEFAULT_PASSWORD)
      const adminUser = {
        id: uuidv4(),
        email: ADMIN_USERNAME,
        password: hashedPassword,
        name: 'StarNews Admin',
        role: ROLES.SUPER_ADMIN,
        status: 'active',
        requirePasswordChange: true, // Force password change on first login
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(adminUser)

      // Initialize default navigation
      const navExists = await db.collection('site_settings').findOne({ type: 'navigation' })
      if (!navExists) {
        await db.collection('site_settings').insertOne({
          id: uuidv4(),
          type: 'navigation',
          items: [
            { id: uuidv4(), label: 'Home', path: 'home', order: 1, active: true },
            { id: uuidv4(), label: 'News', path: 'news', order: 2, active: true },
            { id: uuidv4(), label: 'E-Newspaper', path: 'enewspaper', order: 3, active: true },
            { id: uuidv4(), label: 'Classifieds', path: 'classifieds', order: 4, active: true },
            { id: uuidv4(), label: 'Business Directory', path: 'businesses', order: 5, active: true },
            { id: uuidv4(), label: 'Live TV', path: 'live-tv', order: 6, active: true }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // Initialize breaking news settings
      const breakingExists = await db.collection('site_settings').findOne({ type: 'breaking_news' })
      if (!breakingExists) {
        await db.collection('site_settings').insertOne({
          id: uuidv4(),
          type: 'breaking_news',
          enabled: false,
          articleIds: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Admin account created successfully. Password change required on first login.',
        adminEmail: ADMIN_USERNAME
      }))
    }

    // ==========================================
    // ADMIN: BUSINESS DIRECTORY MANAGEMENT (FULL CRUD)
    // ==========================================

    // Get all businesses (admin view - including disabled)
    if (route === '/admin/businesses' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const allBusinesses = await db.collection('businesses').find({}).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(allBusinesses))
    }

    // Create new business
    if (route === '/admin/businesses' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { name, category, description, images, phone, whatsapp, website, location, googleMapsLink, address, area } = body
      if (!name || !category) {
        return handleCORS(NextResponse.json({ error: 'Name and category are required' }, { status: 400 }))
      }
      const newBusiness = {
        id: uuidv4(),
        name,
        category,
        description: description || '',
        images: images || [],
        coverImage: images?.[0] || '',
        logo: images?.[0] || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        website: website || '',
        location: location || '',
        googleMapsLink: googleMapsLink || '',
        address: address || '',
        area: area || '',
        rating: 0,
        reviewCount: 0,
        enabled: true,
        featured: false,
        approvalStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('businesses').insertOne(newBusiness)
      return handleCORS(NextResponse.json(newBusiness))
    }

    // Update business
    if (route.match(/^\/admin\/businesses\/[^/]+$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const businessId = path[2]
      const body = await request.json()
      const updates = { ...body, updatedAt: new Date() }
      delete updates._id
      delete updates.id
      await db.collection('businesses').updateOne({ id: businessId }, { $set: updates })
      const updated = await db.collection('businesses').findOne({ id: businessId })
      return handleCORS(NextResponse.json(updated))
    }

    // Delete business
    if (route.match(/^\/admin\/businesses\/[^/]+$/) && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const businessId = path[2]
      await db.collection('businesses').deleteOne({ id: businessId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Toggle business enabled/disabled
    if (route.match(/^\/admin\/businesses\/[^/]+\/toggle$/) && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const businessId = path[2]
      const business = await db.collection('businesses').findOne({ id: businessId })
      if (!business) {
        return handleCORS(NextResponse.json({ error: 'Business not found' }, { status: 404 }))
      }
      const newEnabled = !business.enabled
      await db.collection('businesses').updateOne({ id: businessId }, { $set: { enabled: newEnabled, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, enabled: newEnabled }))
    }

    // Public: Get businesses (only enabled)
    if (route === '/businesses' && method === 'GET') {
      const { category, limit = 50, page = 1 } = Object.fromEntries(new URL(request.url).searchParams)
      const query = { enabled: { $ne: false }, approvalStatus: 'approved' }
      if (category && category !== 'All Categories') query.category = category
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const businesses = await db.collection('businesses').find(query).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray()
      const total = await db.collection('businesses').countDocuments(query)
      return handleCORS(NextResponse.json({ businesses, total }))
    }

    // ==========================================
    // ADMIN: CLASSIFIED MANAGEMENT (FULL CRUD)
    // ==========================================

    // Get all classifieds (admin view - including disabled)
    if (route === '/admin/classifieds' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const allClassifieds = await db.collection('classified_ads').find({}).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(allClassifieds))
    }

    // Create new classified
    if (route === '/admin/classifieds' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, category, price, description, images, phone, whatsapp, location, sellerName, condition } = body
      if (!title || !category) {
        return handleCORS(NextResponse.json({ error: 'Title and category are required' }, { status: 400 }))
      }
      const newClassified = {
        id: uuidv4(),
        title,
        category,
        price: price || '',
        description: description || '',
        images: images || [],
        image: images?.[0] || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        location: location || '',
        sellerName: sellerName || '',
        postedBy: sellerName || 'Admin',
        condition: condition || 'Good',
        enabled: true,
        approvalStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('classified_ads').insertOne(newClassified)
      return handleCORS(NextResponse.json(newClassified))
    }

    // Update classified
    if (route.match(/^\/admin\/classifieds\/[^/]+$/) && method === 'PUT') {
      console.log('Update classified route hit, user:', user ? { role: user.role, email: user.email } : 'null')
      if (!isSuperAdmin(user)) {
        console.log('Unauthorized: user role is', user?.role || 'null')
        return handleCORS(NextResponse.json({ error: 'Unauthorized', details: `User role: ${user?.role || 'not authenticated'}` }, { status: 403 }))
      }
      const classifiedId = path[2]
      const body = await request.json()
      const updates = { ...body, updatedAt: new Date() }
      delete updates._id
      delete updates.id
      if (updates.images && updates.images.length > 0) {
        updates.image = updates.images[0]
      }
      await db.collection('classified_ads').updateOne({ id: classifiedId }, { $set: updates })
      const updated = await db.collection('classified_ads').findOne({ id: classifiedId })
      return handleCORS(NextResponse.json(updated))
    }

    // Delete classified
    if (route.match(/^\/admin\/classifieds\/[^/]+$/) && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const classifiedId = path[2]
      await db.collection('classified_ads').deleteOne({ id: classifiedId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Toggle classified enabled/disabled
    if (route.match(/^\/admin\/classifieds\/[^/]+\/toggle$/) && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const classifiedId = path[2]
      const classified = await db.collection('classified_ads').findOne({ id: classifiedId })
      if (!classified) {
        return handleCORS(NextResponse.json({ error: 'Classified not found' }, { status: 404 }))
      }
      const newEnabled = !classified.enabled
      await db.collection('classified_ads').updateOne({ id: classifiedId }, { $set: { enabled: newEnabled, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, enabled: newEnabled }))
    }

    // Public: Get classifieds (only enabled)
    if (route === '/classifieds' && method === 'GET') {
      const { category, limit = 50, page = 1 } = Object.fromEntries(new URL(request.url).searchParams)
      const query = { enabled: { $ne: false }, approvalStatus: 'approved' }
      if (category) query.category = category
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const classifieds = await db.collection('classified_ads').find(query).sort({ approvedAt: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray()
      const total = await db.collection('classified_ads').countDocuments(query)
      return handleCORS(NextResponse.json({ classifieds, total }))
    }

    // PUBLIC: Submit Classified Ad (User submission - goes to PENDING)
    if (route === '/classifieds/submit' && method === 'POST') {
      const body = await request.json()
      const { title, images, description, location, phone, whatsappEnabled } = body

      // Validate required fields
      if (!title || !description || !location || !phone) {
        return handleCORS(NextResponse.json({ error: 'Title, description, location and phone are required' }, { status: 400 }))
      }

      // Validate minimum images
      if (!images || images.length < 1) {
        return handleCORS(NextResponse.json({ error: 'Minimum 1 image required' }, { status: 400 }))
      }

      // Validate maximum images
      if (images.length > 8) {
        return handleCORS(NextResponse.json({ error: 'Maximum 8 images allowed' }, { status: 400 }))
      }

      const newClassified = {
        id: uuidv4(),
        title,
        images: images || [],
        image: images?.[0] || '',
        description,
        location,
        phone,
        whatsappEnabled: whatsappEnabled || false,
        category: 'User Submitted',
        price: '',
        sellerName: 'User',
        condition: 'Good',
        enabled: true,
        approvalStatus: 'pending',
        submittedAt: new Date(),
        approvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('classified_ads').insertOne(newClassified)
      return handleCORS(NextResponse.json({ success: true, message: 'Classified ad submitted for approval', id: newClassified.id }))
    }


    // ==========================================
    // ADMIN: NEWS MANAGEMENT (FULL CRUD)
    // ==========================================

    // Get all news (admin view - including drafts and disabled)
    if (route === '/admin/news' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const allNews = await db.collection('news_articles').find({}).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(allNews))
    }

    // Create news (admin direct publish)
    if (route === '/admin/news' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, category, categoryId, mainImage, galleryImages, metaDescription, tags, genre, featured, showOnHome, videoUrl, youtubeUrl, thumbnailUrl, thumbnails, mediaItems } = body
      if (!title || !content || (!category && !categoryId)) {
        return handleCORS(NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 }))
      }
      const newArticle = {
        id: uuidv4(),
        title,
        content,
        category: category || '',
        categoryId: categoryId || category || '',
        mainImage: mainImage || '',
        galleryImages: galleryImages || [],
        images: galleryImages || [],
        metaDescription: metaDescription || '',
        tags: tags || [],
        videoUrl: videoUrl || youtubeUrl || '',
        youtubeUrl: youtubeUrl || videoUrl || '',
        thumbnailUrl: thumbnailUrl || '',
        thumbnails: thumbnails || [],
        mediaItems: mediaItems || [],
        genre: genre || 'breaking',
        featured: featured || false,
        showOnHome: showOnHome !== false,
        enabled: true,
        views: 0,
        authorId: user.userId,
        approvalStatus: 'approved',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('news_articles').insertOne(newArticle)
      return handleCORS(NextResponse.json(newArticle))
    }

    // Update news (admin)
    if (route.match(/^\/admin\/news\/[^/]+$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const body = await request.json()
      const updates = { ...body, updatedAt: new Date() }
      delete updates._id
      delete updates.id
      await db.collection('news_articles').updateOne({ id: articleId }, { $set: updates })
      const updated = await db.collection('news_articles').findOne({ id: articleId })
      return handleCORS(NextResponse.json(updated))
    }

    // Delete news (admin)
    if (route.match(/^\/admin\/news\/[^/]+$/) && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      await db.collection('news_articles').deleteOne({ id: articleId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Toggle news enabled/disabled
    if (route.match(/^\/admin\/news\/[^/]+\/toggle$/) && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const article = await db.collection('news_articles').findOne({ id: articleId })
      if (!article) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      const newEnabled = !article.enabled
      await db.collection('news_articles').updateOne({ id: articleId }, { $set: { enabled: newEnabled, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, enabled: newEnabled }))
    }

    // Toggle featured for top 6 boxes
    if (route.match(/^\/admin\/news\/[^/]+\/featured$/) && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const article = await db.collection('news_articles').findOne({ id: articleId })
      if (!article) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      const newFeatured = !article.featured
      await db.collection('news_articles').updateOne({ id: articleId }, { $set: { featured: newFeatured, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, featured: newFeatured }))
    }

    // ==========================================
    // ADMIN: HOME PAGE SETTINGS
    // ==========================================

    // Get home page settings
    if (route === '/admin/home-settings' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const settings = await db.collection('site_settings').findOne({ type: 'home_settings' })
      return handleCORS(NextResponse.json(settings || {
        type: 'home_settings',
        topBoxesMode: 'auto', // 'auto' or 'manual'
        topBoxesNewsIds: [],
        trendingSectionEnabled: true,
        businessSectionEnabled: true,
        sportsSectionEnabled: true,
        entertainmentSectionEnabled: true
      }))
    }

    // Update home page settings
    if (route === '/admin/home-settings' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      await db.collection('site_settings').updateOne(
        { type: 'home_settings' },
        { $set: { ...body, type: 'home_settings', updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ==========================================
    // ADMIN: SIDEBAR AD WITH WHATSAPP
    // ==========================================

    // Get sidebar ad settings
    if (route === '/admin/sidebar-ad' && method === 'GET') {
      const settings = await db.collection('site_settings').findOne({ type: 'sidebar_ad' })
      return handleCORS(NextResponse.json(settings || {
        type: 'sidebar_ad',
        enabled: true,
        imageUrl: '',
        linkUrl: '',
        whatsappNumber: '',
        title: 'Sidebar Advertisement'
      }))
    }

    // Update sidebar ad settings
    if (route === '/admin/sidebar-ad' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      await db.collection('site_settings').updateOne(
        { type: 'sidebar_ad' },
        { $set: { ...body, type: 'sidebar_ad', updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ==========================================
    // ADMIN: E-NEWSPAPER MANAGEMENT
    // ==========================================

    // Get all e-newspapers (admin view)
    if (route === '/admin/enewspaper' && method === 'GET') {
      const enewspapers = await db.collection('enewspapers').find({}).sort({ publishDate: -1 }).toArray()
      return handleCORS(NextResponse.json(enewspapers))
    }

    // Create/Upload e-newspaper
    if (route === '/admin/enewspaper' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, pdfUrl, publishDate, thumbnailUrl } = body
      if (!title || !pdfUrl) {
        return handleCORS(NextResponse.json({ error: 'Title and PDF URL are required' }, { status: 400 }))
      }
      const newEnewspaper = {
        id: uuidv4(),
        title,
        pdfUrl,
        thumbnailUrl: thumbnailUrl || '',
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('enewspapers').insertOne(newEnewspaper)
      return handleCORS(NextResponse.json(newEnewspaper))
    }

    // Toggle e-newspaper enabled/disabled
    if (route.match(/^\/admin\/enewspaper\/[^/]+\/toggle$/) && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const enewspaperId = path[2]
      const enewspaper = await db.collection('enewspapers').findOne({ id: enewspaperId })
      if (!enewspaper) {
        return handleCORS(NextResponse.json({ error: 'E-Newspaper not found' }, { status: 404 }))
      }
      const newEnabled = !enewspaper.enabled
      await db.collection('enewspapers').updateOne({ id: enewspaperId }, { $set: { enabled: newEnabled, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, enabled: newEnabled }))
    }

    // Delete e-newspaper
    if (route.match(/^\/admin\/enewspaper\/[^/]+$/) && method === 'DELETE') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const enewspaperId = path[2]
      await db.collection('enewspapers').deleteOne({ id: enewspaperId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Public: Get enabled e-newspapers
    if (route === '/enewspaper' && method === 'GET') {
      const enewspapers = await db.collection('enewspapers').find({ enabled: true }).sort({ publishDate: -1 }).toArray()
      return handleCORS(NextResponse.json(enewspapers))
    }

    // ==========================================
    // PUBLIC: HOME CONTENT (for frontend)
    // ==========================================

    // Get home page content (public)
    if (route === '/home-content' && method === 'GET') {
      // Get home settings
      const homeSettings = await db.collection('site_settings').findOne({ type: 'home_settings' }) || { topBoxesMode: 'auto' }

      // Get top 6 boxes (featured or latest)
      let topBoxesNews
      if (homeSettings.topBoxesMode === 'manual' && homeSettings.topBoxesNewsIds?.length > 0) {
        topBoxesNews = await db.collection('news_articles').find({
          id: { $in: homeSettings.topBoxesNewsIds },
          enabled: { $ne: false },
          approvalStatus: 'approved'
        }).toArray()
        // Sort by the manual order
        topBoxesNews.sort((a, b) => homeSettings.topBoxesNewsIds.indexOf(a.id) - homeSettings.topBoxesNewsIds.indexOf(b.id))
      } else {
        topBoxesNews = await db.collection('news_articles').find({
          enabled: { $ne: false },
          approvalStatus: 'approved',
          $or: [{ featured: true }, { showOnHome: true }]
        }).sort({ featured: -1, publishedAt: -1 }).limit(6).toArray()

        // If not enough featured, fill with latest
        if (topBoxesNews.length < 6) {
          const existingIds = topBoxesNews.map(n => n.id)
          const moreNews = await db.collection('news_articles').find({
            id: { $nin: existingIds },
            enabled: { $ne: false },
            approvalStatus: 'approved'
          }).sort({ publishedAt: -1 }).limit(6 - topBoxesNews.length).toArray()
          topBoxesNews = [...topBoxesNews, ...moreNews]
        }
      }

      // Get sidebar ad
      const sidebarAd = await db.collection('site_settings').findOne({ type: 'sidebar_ad' }) || { enabled: false }

      // Get category news
      const getNewsByCategory = async (category, limit = 6) => {
        return await db.collection('news_articles').find({
          enabled: { $ne: false },
          approvalStatus: 'approved',
          $or: [{ category }, { categoryId: category }, { genre: category.toLowerCase() }]
        }).sort({ publishedAt: -1 }).limit(limit).toArray()
      }

      const [trendingNews, businessNews, sportsNews, entertainmentNews, nationNews] = await Promise.all([
        getNewsByCategory('Trending', 6),
        getNewsByCategory('Business', 3),
        getNewsByCategory('Sports', 3),
        getNewsByCategory('Entertainment', 3),
        getNewsByCategory('Nation', 3)
      ])

      return handleCORS(NextResponse.json({
        topBoxes: topBoxesNews.slice(0, 6),
        sidebarAd,
        trending: trendingNews,
        business: businessNews,
        sports: sportsNews,
        entertainment: entertainmentNews,
        nation: nationNews
      }))
    }

    // ========================================
    // BREAKING NEWS API ENDPOINTS
    // ========================================

    // Seed reporter user (run once)
    if (route === '/seed-reporter' && method === 'POST') {
      const existingReporter = await db.collection('users').findOne({ email: 'aman@reporterStarNews' })
      if (existingReporter) {
        return handleCORS(NextResponse.json({ message: 'Reporter already exists' }))
      }
      const hashedPwd = await hashPassword('StarNews@123')
      const reporterUser = {
        id: uuidv4(),
        email: 'aman@reporterStarNews',
        password: hashedPwd,
        name: 'Aman Reporter',
        role: ROLES.REPORTER,
        approvalStatus: 'approved',
        active: true,
        createdAt: new Date()
      }
      await db.collection('users').insertOne(reporterUser)
      return handleCORS(NextResponse.json({ message: 'Reporter user created successfully', email: 'aman@reporterStarNews' }))
    }

    // ========================================
    // BREAKING TICKER - SINGLE ENTITY MODEL
    // ========================================

    // GET /breaking-ticker - Public endpoint for frontend (returns single active ticker)
    if (route === '/breaking-ticker' && method === 'GET') {
      const ticker = await db.collection('breaking_ticker').findOne({ status: 'active' })
      if (!ticker) {
        return handleCORS(NextResponse.json({ enabled: false, text: '' }))
      }
      return handleCORS(NextResponse.json({
        enabled: true,
        text: ticker.text,
        updatedAt: ticker.updatedAt
      }))
    }

    // GET /reporter/breaking-ticker - Get current ticker for reporter
    if (route === '/reporter/breaking-ticker' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ticker = await db.collection('breaking_ticker').findOne({})
      return handleCORS(NextResponse.json({ ticker: ticker || null }))
    }

    // PUT /reporter/breaking-ticker - Submit breaking ticker for approval (reporter only)
    if (route === '/reporter/breaking-ticker' && method === 'PUT') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { text } = body
      if (!text || !text.trim()) {
        return handleCORS(NextResponse.json({ error: 'Breaking ticker text is required' }, { status: 400 }))
      }

      // If admin, update directly as active
      if (isSuperAdmin(user)) {
        const tickerData = {
          text: text.trim(),
          updatedBy: user.email,
          updatedAt: new Date(),
          status: 'active',
          pendingText: null,
          pendingBy: null,
          pendingAt: null
        }
        await db.collection('breaking_ticker').updateOne({}, { $set: tickerData }, { upsert: true })
        return handleCORS(NextResponse.json({ success: true, message: 'Breaking ticker updated and live', ticker: tickerData }))
      }

      // For reporters, save as pending for admin approval
      const pendingData = {
        pendingText: text.trim(),
        pendingBy: user.email,
        pendingAt: new Date(),
        pendingStatus: 'pending'
      }

      await db.collection('breaking_ticker').updateOne(
        {},
        { $set: pendingData },
        { upsert: true }
      )

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Breaking ticker submitted for admin approval',
        pending: true
      }))
    }

    // GET /admin/pending-ticker - Get pending ticker for admin
    if (route === '/admin/pending-ticker' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ticker = await db.collection('breaking_ticker').findOne({})
      return handleCORS(NextResponse.json({
        ticker: ticker || null,
        hasPending: !!(ticker?.pendingText && ticker?.pendingStatus === 'pending')
      }))
    }

    // PUT /admin/pending-ticker/approve - Approve pending ticker
    if (route === '/admin/pending-ticker/approve' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ticker = await db.collection('breaking_ticker').findOne({})
      if (!ticker?.pendingText) {
        return handleCORS(NextResponse.json({ error: 'No pending ticker to approve' }, { status: 404 }))
      }

      await db.collection('breaking_ticker').updateOne({}, {
        $set: {
          text: ticker.pendingText,
          updatedBy: ticker.pendingBy,
          updatedAt: new Date(),
          status: 'active',
          approvedBy: user.email,
          approvedAt: new Date(),
          pendingText: null,
          pendingBy: null,
          pendingAt: null,
          pendingStatus: null
        }
      })
      return handleCORS(NextResponse.json({ success: true, message: 'Ticker approved and now live' }))
    }

    // PUT /admin/pending-ticker/reject - Reject pending ticker
    if (route === '/admin/pending-ticker/reject' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      await db.collection('breaking_ticker').updateOne({}, {
        $set: {
          pendingText: null,
          pendingBy: null,
          pendingAt: null,
          pendingStatus: 'rejected',
          rejectedBy: user.email,
          rejectedAt: new Date()
        }
      })
      return handleCORS(NextResponse.json({ success: true, message: 'Pending ticker rejected' }))
    }

    // PUT /admin/breaking-ticker/toggle - Admin toggle ticker on/off
    if (route === '/admin/breaking-ticker/toggle' && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ticker = await db.collection('breaking_ticker').findOne({})
      if (!ticker) {
        return handleCORS(NextResponse.json({ error: 'No ticker exists' }, { status: 404 }))
      }
      const newStatus = ticker.status === 'active' ? 'inactive' : 'active'
      await db.collection('breaking_ticker').updateOne({}, { $set: { status: newStatus, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ message: 'Ticker toggled', status: newStatus }))
    }

    // GET /admin/breaking-ticker - Admin view ticker details
    if (route === '/admin/breaking-ticker' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ticker = await db.collection('breaking_ticker').findOne({})
      return handleCORS(NextResponse.json({ ticker: ticker || null }))
    }

    // Legacy endpoint for backward compatibility
    // GET /breaking-news - Redirect to new single ticker
    if (route === '/breaking-news' && method === 'GET') {
      const ticker = await db.collection('breaking_ticker').findOne({ status: 'active' })
      if (!ticker) {
        return handleCORS(NextResponse.json({ enabled: false, items: [] }))
      }
      return handleCORS(NextResponse.json({
        enabled: true,
        items: [{ id: 'main', text: ticker.text }]
      }))
    }

    // GET /reporter/breaking-news - Reporter's breaking news list
    if (route === '/reporter/breaking-news' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const query = isSuperAdmin(user) ? {} : { createdBy: user.userId }
      const items = await db.collection('breaking_news').find(query).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json({ items }))
    }

    // POST /reporter/breaking-news - Create breaking news (English only)
    if (route === '/reporter/breaking-news' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { text, priority = 10 } = body
      // Accept both string and object format for backward compatibility
      const textValue = typeof text === 'object' ? (text.en || text) : text
      if (!textValue) {
        return handleCORS(NextResponse.json({ error: 'Breaking news text is required' }, { status: 400 }))
      }
      const newItem = {
        id: uuidv4(),
        text: textValue, // Store as simple string (English)
        language: 'en',
        priority: parseInt(priority),
        status: 'pending',
        approvalStatus: isSuperAdmin(user) ? 'approved' : 'pending',
        createdBy: user.userId,
        createdByName: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection('breaking_news').insertOne(newItem)
      return handleCORS(NextResponse.json({ message: 'Breaking news created', item: newItem }))
    }

    // PUT /reporter/breaking-news/:id - Update breaking news
    if (route.startsWith('/reporter/breaking-news/') && method === 'PUT') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const itemId = path[2]
      const existing = await db.collection('breaking_news').findOne({ id: itemId })
      if (!existing) {
        return handleCORS(NextResponse.json({ error: 'Item not found' }, { status: 404 }))
      }
      if (!isSuperAdmin(user) && existing.createdBy !== user.userId) {
        return handleCORS(NextResponse.json({ error: 'Cannot edit others items' }, { status: 403 }))
      }
      const body = await request.json()
      const updates = { updatedAt: new Date() }
      if (body.text) updates.text = body.text
      if (body.priority !== undefined) updates.priority = parseInt(body.priority)
      if (body.status) updates.status = body.status
      // Reset approval if reporter edits
      if (!isSuperAdmin(user)) updates.approvalStatus = 'pending'
      await db.collection('breaking_news').updateOne({ id: itemId }, { $set: updates })
      return handleCORS(NextResponse.json({ message: 'Updated', id: itemId }))
    }

    // DELETE /reporter/breaking-news/:id - Delete breaking news
    if (route.startsWith('/reporter/breaking-news/') && method === 'DELETE') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const itemId = path[2]
      const existing = await db.collection('breaking_news').findOne({ id: itemId })
      if (!existing) {
        return handleCORS(NextResponse.json({ error: 'Item not found' }, { status: 404 }))
      }
      if (!isSuperAdmin(user) && existing.createdBy !== user.userId) {
        return handleCORS(NextResponse.json({ error: 'Cannot delete others items' }, { status: 403 }))
      }
      await db.collection('breaking_news').deleteOne({ id: itemId })
      return handleCORS(NextResponse.json({ message: 'Deleted' }))
    }

    // ========================================
    // ADMIN BREAKING NEWS MANAGEMENT
    // ========================================

    // GET /admin/breaking-news - All breaking news for admin
    if (route === '/admin/breaking-news' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const items = await db.collection('breaking_news').find({}).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json({ items }))
    }

    // PUT /admin/breaking-news/:id/approve - Approve breaking news
    if (route.match(/^\/admin\/breaking-news\/[^/]+\/approve$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const itemId = path[2]
      await db.collection('breaking_news').updateOne(
        { id: itemId },
        { $set: { approvalStatus: 'approved', status: 'active', updatedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ message: 'Approved' }))
    }

    // PUT /admin/breaking-news/:id/reject - Reject breaking news
    if (route.match(/^\/admin\/breaking-news\/[^/]+\/reject$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const itemId = path[2]
      await db.collection('breaking_news').updateOne(
        { id: itemId },
        { $set: { approvalStatus: 'rejected', status: 'inactive', updatedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ message: 'Rejected' }))
    }

    // PUT /admin/breaking-news/:id/toggle - Toggle active status
    if (route.match(/^\/admin\/breaking-news\/[^/]+\/toggle$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const itemId = path[2]
      const item = await db.collection('breaking_news').findOne({ id: itemId })
      if (!item) {
        return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      }
      const newStatus = item.status === 'active' ? 'inactive' : 'active'
      await db.collection('breaking_news').updateOne(
        { id: itemId },
        { $set: { status: newStatus, updatedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ message: 'Toggled', status: newStatus }))
    }

    // ========================================
    // REPORTER NEWS SUBMISSIONS
    // ========================================

    // GET /reporter/news - Reporter's own news
    if (route === '/reporter/news' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const query = isSuperAdmin(user) ? {} : { authorId: user.userId }
      const articles = await db.collection('news_articles').find(query).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json({ articles }))
    }

    // POST /reporter/news - Submit news (English only)
    if (route === '/reporter/news' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, categoryId, mainImage, galleryImages, videoUrl, mediaType, authorName, thumbnailUrl } = body
      // Accept both string and object format for backward compatibility
      const titleValue = typeof title === 'object' ? (title.en || title) : title
      const contentValue = typeof content === 'object' ? (content.en || content) : content
      if (!titleValue) {
        return handleCORS(NextResponse.json({ error: 'Title is required' }, { status: 400 }))
      }
      const newArticle = {
        id: uuidv4(),
        title: titleValue, // Store as simple string (English)
        content: contentValue || '',
        language: 'en',
        categoryId: categoryId || 'general',
        mainImage: mainImage || '',
        galleryImages: galleryImages || [],
        thumbnailUrl: thumbnailUrl || '',
        videoUrl: videoUrl || '',
        mediaType: mediaType || 'text',
        authorId: user.userId,
        authorName: authorName || user.email,
        approvalStatus: isSuperAdmin(user) ? 'approved' : 'pending',
        status: 'draft',
        views: 0,
        featured: false,
        createdAt: new Date(),
        publishedAt: isSuperAdmin(user) ? new Date() : null,
        updatedAt: new Date()
      }
      await db.collection('news_articles').insertOne(newArticle)
      return handleCORS(NextResponse.json({ message: 'News submitted', article: newArticle }))
    }

    // PUT /reporter/news/:id - Update news submission
    if (route.startsWith('/reporter/news/') && method === 'PUT') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const articleId = path[2]
      const existing = await db.collection('news_articles').findOne({ id: articleId })
      if (!existing) {
        return handleCORS(NextResponse.json({ error: 'Article not found' }, { status: 404 }))
      }
      if (!isSuperAdmin(user) && existing.authorId !== user.userId) {
        return handleCORS(NextResponse.json({ error: 'Cannot edit others articles' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, content, categoryId, mainImage, galleryImages, videoUrl, mediaType, authorName, thumbnailUrl } = body
      const titleValue = typeof title === 'object' ? (title.en || title) : title
      const contentValue = typeof content === 'object' ? (content.en || content) : content

      const updates = {
        title: titleValue || existing.title,
        content: contentValue || existing.content,
        categoryId: categoryId || existing.categoryId,
        mainImage: mainImage !== undefined ? mainImage : existing.mainImage,
        galleryImages: galleryImages !== undefined ? galleryImages : existing.galleryImages,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
        videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
        mediaType: mediaType || existing.mediaType,
        approvalStatus: isSuperAdmin(user) ? 'approved' : 'pending', // Reset to pending for re-review
        adminResponse: null, // Clear previous admin response
        updatedAt: new Date(),
        authorName: authorName !== undefined ? authorName : existing.authorName
      }

      await db.collection('news_articles').updateOne({ id: articleId }, { $set: updates })
      return handleCORS(NextResponse.json({ message: 'Article updated and resubmitted for review' }))
    }

    // ========================================
    // E-NEWSPAPER ROUTES (REPORTER)
    // ========================================

    // GET /reporter/enewspaper - Reporter's uploaded E-Newspapers
    if (route === '/reporter/enewspaper' && method === 'GET') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const query = isSuperAdmin(user) ? {} : { uploadedBy: user.email }
      const papers = await db.collection('reporter_enewspapers').find(query).sort({ uploadedAt: -1 }).toArray()
      return handleCORS(NextResponse.json({ papers }))
    }

    // POST /reporter/enewspaper - Upload E-Newspaper
    if (route === '/reporter/enewspaper' && method === 'POST') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { title, editionDate, pdfUrl, thumbnailUrl, description } = body
      if (!title || !editionDate || !pdfUrl) {
        return handleCORS(NextResponse.json({ error: 'Title, Edition Date, and PDF URL are required' }, { status: 400 }))
      }
      const newPaper = {
        id: uuidv4(),
        title: title.trim(),
        editionDate: new Date(editionDate),
        pdfUrl: pdfUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || '',
        description: description?.trim() || '',
        uploadedBy: user.email,
        uploadedAt: new Date(),
        approvalStatus: isSuperAdmin(user) ? 'approved' : 'pending',
        adminResponse: null,
        updatedAt: new Date()
      }
      await db.collection('reporter_enewspapers').insertOne(newPaper)
      return handleCORS(NextResponse.json({ message: 'E-Newspaper uploaded successfully', paper: newPaper }))
    }

    // DELETE /reporter/enewspaper/:id - Delete E-Newspaper
    if (route.startsWith('/reporter/enewspaper/') && method === 'DELETE') {
      if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const paperId = path[2]
      const paper = await db.collection('reporter_enewspapers').findOne({ id: paperId })
      if (!paper) {
        return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      }
      if (!isSuperAdmin(user) && paper.uploadedBy !== user.email) {
        return handleCORS(NextResponse.json({ error: 'Cannot delete others papers' }, { status: 403 }))
      }
      await db.collection('reporter_enewspapers').deleteOne({ id: paperId })
      return handleCORS(NextResponse.json({ message: 'E-Newspaper deleted' }))
    }

    // GET /admin/enewspaper - Admin view all E-Newspapers
    if (route === '/admin/enewspaper' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const papers = await db.collection('reporter_enewspapers').find({}).sort({ uploadedAt: -1 }).toArray()
      return handleCORS(NextResponse.json({ papers }))
    }

    // PUT /admin/enewspaper/:id/approve - Approve E-Newspaper
    if (route.match(/^\/admin\/enewspaper\/[^/]+\/approve$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const paperId = path[2]
      await db.collection('reporter_enewspapers').updateOne(
        { id: paperId },
        { $set: { approvalStatus: 'approved', adminResponse: null, updatedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ message: 'E-Newspaper approved' }))
    }

    // PUT /admin/enewspaper/:id/reject - Reject E-Newspaper
    if (route.match(/^\/admin\/enewspaper\/[^/]+\/reject$/) && method === 'PUT') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const paperId = path[2]
      const body = await request.json()
      const { reason } = body
      await db.collection('reporter_enewspapers').updateOne(
        { id: paperId },
        { $set: { approvalStatus: 'rejected', adminResponse: reason || 'Rejected by admin', updatedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ message: 'E-Newspaper rejected' }))
    }


    // GET /enewspaper/public - Public approved E-Newspapers
    if (route === '/enewspaper/public' && method === 'GET') {
      const papers = await db.collection('reporter_enewspapers').find({ approvalStatus: 'approved' }).sort({ editionDate: -1 }).limit(20).toArray()
      return handleCORS(NextResponse.json({ papers }))
    }

    // ========================================
    // PREMIUM AD ROUTES
    // ========================================

    // POST /admin/ads/premium - Save Premium Ad Settings (Admin only)
    if (route === '/admin/ads/premium' && method === 'POST') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const body = await request.json()
      const { enabled, imageUrl, linkUrl, title } = body

      const updateData = { updatedAt: new Date() }
      if (enabled !== undefined) updateData.enabled = Boolean(enabled)
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl
      if (linkUrl !== undefined) updateData.linkUrl = linkUrl
      if (title !== undefined) updateData.title = title

      await db.collection('premium_ads').updateOne(
        { _id: 'main' },
        { $set: updateData },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ message: 'Premium Ad settings saved' }))
    }

    // GET /ads/premium - Public endpoint to fetch premium ad
    if (route === '/ads/premium' && method === 'GET') {
      const ad = await db.collection('premium_ads').findOne({ _id: 'main' })
      // If no record in DB, return enabled:true with empty values (show default banner)
      if (!ad) {
        return handleCORS(NextResponse.json({ enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Advertisement Space' }))
      }
      // If record exists but disabled, return disabled
      if (!ad.enabled) {
        return handleCORS(NextResponse.json({ enabled: false }))
      }
      return handleCORS(NextResponse.json({
        enabled: true,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        title: ad.title
      }))
    }

    // GET /admin/ads/premium - Admin view settings
    if (route === '/admin/ads/premium' && method === 'GET') {
      if (!isSuperAdmin(user)) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }
      const ad = await db.collection('premium_ads').findOne({ _id: 'main' })
      return handleCORS(NextResponse.json({
        settings: ad || { enabled: false, imageUrl: '', linkUrl: '', title: '' }
      }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
