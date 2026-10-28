const managerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next()
  }

  if (req.user && req.user.role === 'admin') {
    return next()
  }

  return res.status(403).json({ message: 'Manager access required.' })
}

module.exports = managerOnly
