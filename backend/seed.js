const dotenv = require('dotenv')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const Product = require('./models/Product')
const products = require('./data/products')

dotenv.config()

const seedProducts = async ({ closeConnectionAfter = true } = {}) => {
  try {
    await Product.deleteMany({})
    await Product.insertMany(products)
    console.log(`Seeded ${products.length} products into MongoDB.`)
  } catch (error) {
    console.error('Product seeding failed:', error.message)
  } finally {
    if (closeConnectionAfter) {
      await mongoose.connection.close()
    }
  }
}

if (require.main === module) {
  connectDB().then(() => seedProducts({ closeConnectionAfter: true }))
}

module.exports = { seedProducts }
