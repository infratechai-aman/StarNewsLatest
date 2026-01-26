import mongoose from 'mongoose'

// Connection state for serverless caching
let isConnected = false

/**
 * Connect to MongoDB Atlas with proper TLS support for cloud environments
 * Prevents multiple connections in serverless environments
 */
export async function connectDB() {
    // Return if already connected
    if (isConnected) {
        console.log('Using existing MongoDB connection')
        return
    }

    // Check for mongoose connection state
    if (mongoose.connections[0].readyState === 1) {
        isConnected = true
        console.log('Using existing mongoose connection')
        return
    }

    // Get connection string from environment
    const uri = process.env.MONGO_URL
    if (!uri) {
        throw new Error('MONGO_URL environment variable is not defined')
    }

    try {
        console.log('Connecting to MongoDB Atlas...')

        await mongoose.connect(uri, {
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
        })

        isConnected = true
        console.log('MongoDB connected successfully')
    } catch (error) {
        isConnected = false
        console.error('MongoDB connection error:', error.message)
        throw new Error(`Database connection failed: ${error.message}`)
    }
}

/**
 * Get the mongoose connection
 */
export function getConnection() {
    return mongoose.connection
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
    if (!isConnected) return

    await mongoose.disconnect()
    isConnected = false
    console.log('MongoDB disconnected')
}

export default connectDB
