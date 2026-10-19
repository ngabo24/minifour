const chefOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'chef') {
    return res.status(403).json({ message: 'Access denied. Chef role required.' })
  }

  next()
}

module.exports = chefOnly
