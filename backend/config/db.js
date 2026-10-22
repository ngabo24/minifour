const mongoose = require('mongoose')
const { loadEnv } = require('./env')

loadEnv()

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI
  if (!mongoURI) {
    throw new Error('MONGODB_URI is required in backend/.env.')
  }

  try {
    await mongoose.connect(mongoURI, {
      dbName: process.env.MONGODB_DB_NAME || 'minifour',
    })
    console.log(`MongoDB connected to database: ${mongoose.connection.name}`)
    return mongoose.connection.name
  } catch (error) {
    console.error('MongoDB connection failed. Check backend/.env and the database network/access settings.')
    console.error(error.message)
    throw error
  }
}

module.exports = connectDB
module.exports.connectDB = connectDB

