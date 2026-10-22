const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer = null
let app = null

// Boots an in-memory MongoDB instance, points the API at it and returns the
// Express app. The system mongod binary is used when available so the tests do
// not need to download a MongoDB release.
//
// Environment variables are set before the app module is loaded so that the
// rate limiters and the database connection pick up the test configuration.
const startTestServer = async ({ env = {} } = {}) => {
  if (app) return app

  mongoServer = await MongoMemoryServer.create({
    binary: { systemBinary: '/usr/bin/mongod' },
    instance: { dbName: 'minifour-test' },
  })

  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongoServer.getUri(),
    MONGODB_DB_NAME: 'minifour-test',
    JWT_SECRET: 'test-jwt-secret-for-minifour-suite',
    // High limits keep the shared app usable across the whole suite. The rate
    // limiter itself is covered by tests/security.test.js.
    RATE_LIMIT_MAX: '100000',
    AUTH_RATE_LIMIT_MAX: '100000',
    ORDER_RATE_LIMIT_MAX: '100000',
  }, env)

  app = require('../../server')
  await app.ensureDatabaseReady()

  return app
}

const stopTestServer = async () => {
  if (!app) return

  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()

  mongoServer = null
  app = null
}

const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
}

module.exports = { startTestServer, stopTestServer, clearDatabase }

