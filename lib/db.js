// backend/lib/db.js

export const runtime = "nodejs";

import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null }

export async function connectToDB() {
    if (cached.conn) {
        return cached.conn
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables')
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Connection pool settings for PM2 persistent environment
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 60000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            retryWrites: true,
            retryReads: true,
        }

        try {
            console.log('Connecting to MongoDB via Mongoose...')
            cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then(mongoose => {
                console.log('Connected to MongoDB via Mongoose successfully')
                return mongoose
            })
        } catch (error) {
            console.error('MongoDB connection error:', error)
            throw error
        }
    }

    try {
        cached.conn = await cached.promise
        return cached.conn
    } catch (error) {
        console.error('Error getting cached connection:', error)
        cached.promise = null
        throw error
    }
}
