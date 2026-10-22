const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { getJwtSecret } = require('../config/env')

const router = express.Router()
const loginAttempts = new Map()
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 10 * 60 * 1000
const jwtSecret = getJwtSecret()

const getClientKey = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim()

const generateToken = (id, role) =>
  jwt.sign({ id, role }, jwtSecret, { expiresIn: '12h' })

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' })
  }

  if (!User.isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    })
  }

  // Public registration can only ever create a client account. Staff accounts
  // are provisioned by an administrator through the admin API.
  if (role && !['client'].includes(role)) {
    return res.status(403).json({ message: 'Staff accounts cannot be created through public registration.' })
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with that email.' })
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'client'
  })

  res.status(201).json({
    token: generateToken(user._id, user.role),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const clientKey = getClientKey(req)

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const now = Date.now()
  const attempts = loginAttempts.get(clientKey) || { count: 0, lastAttempt: 0 }

  if (attempts.lastAttempt && now - attempts.lastAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(clientKey)
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many failed login attempts. Please try again later.' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    loginAttempts.set(clientKey, { count: attempts.count + 1, lastAttempt: now })
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    loginAttempts.set(clientKey, { count: attempts.count + 1, lastAttempt: now })
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  loginAttempts.delete(clientKey)

  res.json({
    token: generateToken(user._id, user.role),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

module.exports = router
