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
        }

        try {
            console.log('Connecting to MongoDB...')
            cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then(mongoose => {
                console.log('Connected to MongoDB successfully')
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
