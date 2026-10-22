const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const { startTestServer, stopTestServer, clearDatabase } = require('./helpers/testApp')
const { createAdmin, createClient, ADMIN_PASSWORD, CLIENT_PASSWORD } = require('./helpers/fixtures')

let app

test.before(async () => {
  app = await startTestServer()
})

test.after(async () => {
  await stopTestServer()
})

test.beforeEach(async () => {
  await clearDatabase()
})

test.describe('authentication', () => {
  test('registers a client and returns a usable token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New Client', email: 'new@test.minifour.com', password: 'Strong@Pass123' })

    assert.equal(response.status, 201)
    assert.ok(response.body.token)
    assert.equal(response.body.user.email, 'new@test.minifour.com')
    assert.equal(response.body.user.role, 'client')
    assert.equal(response.body.user.password, undefined)
  })

  test('rejects a weak password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@test.minifour.com', password: 'weak' })

    assert.equal(response.status, 400)
    assert.match(response.body.message, /at least 8 characters/i)
  })

  test('rejects a duplicate email', async () => {
    await createClient('dupe@test.minifour.com')

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dupe', email: 'dupe@test.minifour.com', password: 'Strong@Pass123' })

    assert.equal(response.status, 400)
    assert.match(response.body.message, /already exists/i)
  })

  test('never allows self registering as an admin', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@test.minifour.com', password: 'Strong@Pass123', role: 'admin' })

    assert.equal(response.status, 403)
    assert.match(response.body.message, /staff accounts cannot be created/i)
  })

  test('logs in with valid credentials', async () => {
    await createClient('login@test.minifour.com')

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.minifour.com', password: CLIENT_PASSWORD })

    assert.equal(response.status, 200)
    assert.ok(response.body.token)
    assert.equal(response.body.user.email, 'login@test.minifour.com')
  })

  test('rejects an invalid password without revealing which field was wrong', async () => {
    await createClient('wrong@test.minifour.com')

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.minifour.com', password: 'Wrong@Pass999' })

    assert.equal(response.status, 401)
    assert.equal(response.body.message, 'Invalid email or password.')
  })

  test('rejects an unknown email with the same message', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.minifour.com', password: CLIENT_PASSWORD })

    assert.equal(response.status, 401)
    assert.equal(response.body.message, 'Invalid email or password.')
  })

  test('rejects a missing token on protected routes', async () => {
    const response = await request(app).get('/api/users/me')

    assert.equal(response.status, 401)
    assert.match(response.body.message, /not authorized/i)
  })

  test('rejects a tampered token on protected routes', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer not-a-real-token')

    assert.equal(response.status, 401)
    assert.match(response.body.message, /not authorized/i)
  })

  test('blocks a client from admin only routes', async () => {
    const client = await createClient('regular@test.minifour.com')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@test.minifour.com', password: CLIENT_PASSWORD })

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${login.body.token}`)

    assert.equal(response.status, 403)
    assert.match(response.body.message, /admin role required/i)
    assert.ok(client)
  })

  test('allows an admin through admin only routes', async () => {
    await createAdmin()

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.minifour.com', password: ADMIN_PASSWORD })

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${login.body.token}`)

    assert.equal(response.status, 200)
    assert.ok(Array.isArray(response.body))
  })

  test('returns the signed in user without the password', async () => {
    await createClient('me@test.minifour.com')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@test.minifour.com', password: CLIENT_PASSWORD })

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${login.body.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.email, 'me@test.minifour.com')
    assert.equal(response.body.password, undefined)
  })
})
