const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const { startTestServer, stopTestServer, clearDatabase } = require('./helpers/testApp')
const {
  createProduct,
  createTable,
  createClient,
  createChef,
  guestAddress,
  guestEmail,
  CLIENT_PASSWORD,
  CHEF_PASSWORD,
} = require('./helpers/fixtures')
const Order = require('../models/Order')

let app
let product

const buildOrderPayload = (overrides = {}) => ({
  items: [{ product: product._id, name: product.name, price: product.price, quantity: 2 }],
  address: {
    firstName: 'Guest',
    lastName: 'Tester',
    email: 'guest@minifour.local',
    street: 'Walk-in Counter',
    city: 'Restaurant',
    country: 'Local',
    zip: '0000',
  },
  paymentMethod: 'Pay now (manual)',
  ...overrides,
})

test.before(async () => {
  app = await startTestServer()
})

test.after(async () => {
  await stopTestServer()
})

test.beforeEach(async () => {
  await clearDatabase()
  product = await createProduct()
})

test.describe('orders', () => {
  test('rejects an order without cart items', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(buildOrderPayload({ items: [] }))

    assert.equal(response.status, 400)
    assert.match(response.body.message, /cart items are required/i)
  })

  test('rejects an order without a delivery address', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(buildOrderPayload({ address: {} }))

    assert.equal(response.status, 400)
    assert.match(response.body.message, /delivery address is required/i)
  })

  test('creates a guest order and calculates the totals from the database prices', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(buildOrderPayload())

    assert.equal(response.status, 201)
    assert.equal(response.body.order.paymentStatus, 'pending_confirmation')
    assert.equal(response.body.order.subtotal, product.price * 2)
    assert.equal(response.body.order.total, product.price * 2)
    assert.equal(response.body.order.deliveryFee, 0)
  })

  test('stores the cost price for profit reporting', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(buildOrderPayload())

    assert.equal(response.body.order.totalCost, product.costPrice * 2)
  })

  test('attaches the order to the signed in user', async () => {
    const user = await createClient('buyer@test.minifour.com')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.minifour.com', password: CLIENT_PASSWORD })

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send(buildOrderPayload())

    assert.equal(response.status, 201)
    assert.equal(String(response.body.order.user), String(user._id))
  })
