const express = require('express')
const protect = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  })
})

module.exports = router
