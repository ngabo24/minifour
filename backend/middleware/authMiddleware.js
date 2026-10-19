const jwt = require('jsonwebtoken')
const User = require('../models/User')

const jwtSecret = process.env.JWT_SECRET || 'minifour-super-secure-dev-secret-change-me'

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

module.exports = protect
