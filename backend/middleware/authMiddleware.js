const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { getJwtSecret } = require('../config/env')

const jwtSecret = getJwtSecret()

const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, jwtSecret)
    const user = await User.findById(decoded.id).select('-password')

    return user || null
  } catch (error) {
    return null
  }
}

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, jwtSecret)
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' })
  }
}

// Populates req.user when a valid token is present, but never rejects the request.
// Used by endpoints that serve both authenticated customers and table guests.
const optionalAuth = async (req, res, next) => {
  req.user = await verifyToken(req.headers.authorization)
  next()
}

module.exports = protect
module.exports.protect = protect
module.exports.optionalAuth = optionalAuth
