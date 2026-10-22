const express = require('express')
const cloudinary = require('cloudinary').v2
const QRCode = require('qrcode')
const Product = require('../models/Product')
const Order = require('../models/Order')
const User = require('../models/User')
const Ingredient = require('../models/Ingredient')
const Table = require('../models/Table')
const Reservation = require('../models/Reservation')
const protect = require('../middleware/authMiddleware')
const adminOnly = require('../middleware/adminMiddleware')
const { MENU_CATEGORIES, isValidCategory } = require('../data/categories')
const googleDrive = require('../services/googleDrive')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const buildTableQrCodeUrl = async (tableNumber) => {
  const targetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?table=${tableNumber}`

  try {
    return await QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('Failed to generate table QR code:', error.message)
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`
  }
}

const router = express.Router()

router.use(protect)
router.use(adminOnly)

router.post('/upload-image', protect, adminOnly, async (req, res) => {
  const { file, filename, mimeType, folderId } = req.body || {}

  if (!googleDrive.isConfigured()) {
    return res.status(503).json({ message: 'Google Drive is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in backend/.env.' })
  }

  if (!file || !filename) {
    return res.status(400).json({ message: 'An image file and filename are required.' })
  }

  try {
    const buffer = Buffer.from(String(file).replace(/^data:[^;]*;base64,/, ''), 'base64')
    const driveFile = await googleDrive.uploadFile(buffer, filename, mimeType || 'image/jpeg', folderId || null)

    const publicUrl = driveFile.webContentLink || `https://drive.google.com/uc?export=view&id=${driveFile._id}`

    res.json({
      id: driveFile._id,
      name: driveFile.name,
      url: publicUrl,
      webContentLink: driveFile.webContentLink,
      thumbnailLink: driveFile.thumbnailLink,
    })
  } catch (error) {
    console.error('Google Drive upload failed:', error.message)
    res.status(500).json({ message: error.message || 'Image upload failed.' })
  }
})

router.get('/drive-images', protect, adminOnly, async (req, res) => {
  const { folderId } = req.query

  if (!googleDrive.isConfigured()) {
    return res.status(503).json({ message: 'Google Drive is not configured.' })
  }

  try {
    const files = await googleDrive.listDriveImages(folderId || null)
    res.json(files)
  } catch (error) {
    console.error('Google Drive list failed:', error.message)
    res.status(500).json({ message: error.message || 'Failed to list Google Drive images.' })
  }
})

router.delete('/drive-images/:fileId', protect, adminOnly, async (req, res) => {
  if (!googleDrive.isConfigured()) {
    return res.status(503).json({ message: 'Google Drive is not configured.' })
  }

  try {
    await googleDrive.deleteFile(req.params.fileId)
    res.json({ message: 'Image removed from Google Drive.' })
  } catch (error) {
    console.error('Google Drive delete failed:', error.message)
    res.status(500).json({ message: error.message || 'Failed to delete image from Google Drive.' })
  }
})

router.post('/upload-signature', async (req, res) => {
  const { folder = 'minifour' } = req.body || {}

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(400).json({ message: 'Cloudinary environment variables are not configured.' })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { folder, timestamp }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET)

  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    timestamp,
    signature,
    folder,
  })
})

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 })
  res.json(users)
})

router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' })
  }

  if (!User.isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(400).json({ message: 'A user with this email already exists.' })
  }

  const normalizedRole = ['admin', 'chef', 'client'].includes(role) ? role : 'client'
  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, password, role: normalizedRole })

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  })
})

router.delete('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  await user.deleteOne()
  res.json({ message: 'User deleted successfully.' })
})

router.get('/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 })
  res.json(products)
})

router.post('/products', async (req, res) => {
  const { name, description, price, costPrice, category, image, stock, featured, ingredients } = req.body

  if (!name || !description || !price || !category) {
    return res.status(400).json({ message: 'Name, description, price, and category are required.' })
  }

  if (!isValidCategory(category)) {
    return res.status(400).json({ message: `Category must be one of: ${MENU_CATEGORIES.join(', ')}.` })
  }

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    costPrice: Number(costPrice || 0),
    category: String(category).trim(),
    image: image || 'menu-chicken-rice.webp',
    stock: Number(stock || 0),
    featured: Boolean(featured),
    ingredients: Array.isArray(ingredients) ? ingredients : []
  })

  res.status(201).json(product)
})

router.put('/products/:id', async (req, res) => {
  const { name, description, price, costPrice, category, image, stock, featured, ingredients } = req.body

  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  if (category && !isValidCategory(category)) {
    return res.status(400).json({ message: `Category must be one of: ${MENU_CATEGORIES.join(', ')}.` })
  }

  product.name = name || product.name
  product.description = description || product.description
  product.price = price ?? product.price
  product.costPrice = costPrice ?? product.costPrice
  product.category = category ? String(category).trim() : product.category
  product.image = image || product.image
  product.stock = stock ?? product.stock
  product.featured = typeof featured === 'boolean' ? featured : product.featured
  product.ingredients = Array.isArray(ingredients) ? ingredients : product.ingredients

  await product.save()
  res.json(product)
})

router.delete('/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  let imageDeleted = false
  try {
    const imageUrl = product.image || ''

    // Cloudinary cleanup
    const cloudinaryHost = `${process.env.CLOUDINARY_CLOUD_NAME}.res.cloudinary.com`
    if (imageUrl && new URL(imageUrl).hostname === cloudinaryHost) {
      const publicIdMatch = new URL(imageUrl).pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/)
      if (publicIdMatch) {
        const publicId = decodeURIComponent(publicIdMatch[1])
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true,
        })
        imageDeleted = result.result === 'ok' || result.result === 'not found'
      }
    }

    // Google Drive cleanup
    if (googleDrive.isConfigured()) {
      const driveIdMatch = imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || imageUrl.match(/drive\.google\.com\/(?:u\/\d+\/)?(?:d|file)\/([a-zA-Z0-9_-]+)/)
      if (driveIdMatch) {
        try {
          await googleDrive.deleteFile(driveIdMatch[1])
          imageDeleted = true
        } catch {
          // Non-fatal
        }
      }
    }
  } catch (error) {
    console.error('Product image cleanup failed:', error.message)
  }

  await product.deleteOne()
  res.json({ message: 'Product deleted successfully.', imageDeleted })
})

router.get('/tables', async (req, res) => {
  const tables = await Table.find().sort({ number: 1 })
  res.json(tables)
})

router.post('/tables', async (req, res) => {
  const { number, name } = req.body

  if (!number) {
    return res.status(400).json({ message: 'Table number is required.' })
  }

  const parsedNumber = Number(number)
  if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
    return res.status(400).json({ message: 'Table number must be a positive integer.' })
  }

  const existing = await Table.findOne({ number: parsedNumber })
  if (existing) {
    return res.status(400).json({ message: 'This table number already exists.' })
  }

  const table = await Table.create({
    number: parsedNumber,
    name: name || `Table ${parsedNumber}`,
    active: true,
    qrCodeUrl: await buildTableQrCodeUrl(parsedNumber),
  })

  res.status(201).json(table)
})

router.delete('/tables/:id', async (req, res) => {
  const table = await Table.findById(req.params.id)
  if (!table) {
    return res.status(404).json({ message: 'Table not found.' })
  }

  await table.deleteOne()
  res.json({ message: 'Table deleted successfully.' })
})

router.get('/ingredients', async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 })
  res.json(ingredients)
})

router.post('/ingredients', async (req, res) => {
  const { name, category, unit, stock, costPerUnit, minimumLevel } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Ingredient name is required.' })
  }

  const ingredient = await Ingredient.create({
    name,
    category: category || 'general',
    unit: unit || 'pcs',
    stock: Number(stock || 0),
    costPerUnit: Number(costPerUnit || 0),
    minimumLevel: Number(minimumLevel || 0)
  })

  res.status(201).json(ingredient)
})

router.put('/ingredients/:id', async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id)
  if (!ingredient) {
    return res.status(404).json({ message: 'Ingredient not found.' })
  }

  ingredient.name = req.body.name || ingredient.name
  ingredient.category = req.body.category || ingredient.category
  ingredient.unit = req.body.unit || ingredient.unit
  ingredient.stock = req.body.stock ?? ingredient.stock
  ingredient.costPerUnit = req.body.costPerUnit ?? ingredient.costPerUnit
  ingredient.minimumLevel = req.body.minimumLevel ?? ingredient.minimumLevel

  await ingredient.save()
  res.json(ingredient)
})

router.delete('/ingredients/:id', async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id)
  if (!ingredient) {
    return res.status(404).json({ message: 'Ingredient not found.' })
  }

  await ingredient.deleteOne()
  res.json({ message: 'Ingredient deleted successfully.' })
})

router.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 })
  res.json(orders)
})

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' })
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  order.status = status
  if (status === 'cancelled') {
    order.paymentStatus = 'cancelled'
  } else if (order.paymentStatus === 'unpaid') {
    order.paymentStatus = 'manual_paid'
  }

  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

router.put('/orders/:id/payment', async (req, res) => {
  const { paymentStatus, paymentReference } = req.body
  const order = await Order.findById(req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  order.paymentStatus = paymentStatus || order.paymentStatus
  order.paymentReference = paymentReference || order.paymentReference
  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

router.get('/summary', async (req, res) => {
  const orders = await Order.find({ paymentStatus: { $ne: 'cancelled' } })
  const ingredients = await Ingredient.find()

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const totalCost = orders.reduce((sum, order) => sum + Number(order.totalCost || 0), 0)
  const grossProfit = totalRevenue - totalCost
  const lowStockIngredients = ingredients.filter((ingredient) => ingredient.stock <= ingredient.minimumLevel).length

  res.json({
    totalOrders: orders.length,
    totalRevenue,
    totalCost,
    grossProfit,
    activeOrders: orders.filter((order) => ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)).length,
    lowStockIngredients,
    ingredientCount: ingredients.length
  })
})

router.get('/analytics', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  const productMap = await Product.find().lean()

  const revenueTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    const key = date.toISOString().slice(0, 10)
    const total = orders
      .filter((order) => order.createdAt && new Date(order.createdAt).toISOString().slice(0, 10) === key)
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), total }
  })

  const categoryTotals = {} 
  for (const order of orders) {
    for (const item of order.items || []) {
      const product = productMap.find((entry) => String(entry._id) === String(item.product))
      const category = product?.category || 'General'
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(item.quantity || 0)
    }
  }

  const topProducts = Object.values(
    orders.reduce((acc, order) => {
      for (const item of order.items || []) {
        const key = item.name
        acc[key] = acc[key] || { name: item.name, quantity: 0 }
        acc[key].quantity += Number(item.quantity || 0)
      }
      return acc
    }, {})
  ).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  const summary = {
    totalRevenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    totalOrders: orders.length,
    avgOrderValue: orders.length ? orders.reduce((sum, order) => sum + Number(order.total || 0), 0) / orders.length : 0,
    bestDay: revenueTrend.reduce((best, day) => (day.total > best.total ? day : best), { day: 'N/A', total: 0 }),
  }

  res.json({ summary, revenueTrend, topProducts, categoryTotals })
})

router.get('/reservations', async (req, res) => {
  const { date, status, tableNumber, search } = req.query
  const filter = {}

  if (date) filter.reservationDate = String(date)
  if (status && status !== 'all') filter.status = String(status)
  if (tableNumber) filter.tableNumber = Number(tableNumber)
  if (search) {
    filter.$or = [
      { guestName: { $regex: String(search), $options: 'i' } },
      { email: { $regex: String(search), $options: 'i' } },
      { phone: { $regex: String(search), $options: 'i' } },
    ]
  }

  const reservations = await Reservation.find(filter).sort({ reservationDate: 1, reservationTime: 1 })
  res.json(reservations)
})

router.post('/reservations', async (req, res) => {
  const { guestName, email, phone, tableNumber, partySize, reservationDate, reservationTime, notes } = req.body

  if (!guestName || !reservationDate || !reservationTime || !partySize) {
    return res.status(400).json({ message: 'Guest name, date, time, and party size are required.' })
  }

  const parsedNumber = tableNumber !== undefined && tableNumber !== null && tableNumber !== '' ? Number(tableNumber) : null
  const parsedPartySize = Number(partySize)

  if (!Number.isInteger(parsedPartySize) || parsedPartySize < 1) {
    return res.status(400).json({ message: 'Party size must be at least 1.' })
  }

  if (parsedNumber) {
    const tableExists = await Table.findOne({ number: parsedNumber })
    if (!tableExists) {
      return res.status(400).json({ message: 'Selected table does not exist.' })
    }
  }

  const reservation = await Reservation.create({
    guestName,
    email: email || '',
    phone: phone || '',
    tableNumber: parsedNumber,
    partySize: parsedPartySize,
    reservationDate,
    reservationTime,
    notes: notes || '',
    status: 'pending'
  })

  res.status(201).json(reservation)
})

router.put('/reservations/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'confirmed', 'arrived', 'seated', 'cancelled']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid reservation status.' })
  }

  const reservation = await Reservation.findById(req.params.id)
  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found.' })
  }

  reservation.status = status
  await reservation.save()
  res.json(reservation)
})

router.delete('/reservations/:id', async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found.' })
  }

  await reservation.deleteOne()
  res.json({ message: 'Reservation deleted successfully.' })
})

router.get('/payments', async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 })
  const payments = orders.map((order) => ({
    _id: order._id,
    customer: order.user ? order.user.name : order.guestName || 'Guest',
    tableNumber: order.tableNumber,
    total: Number(order.total || 0),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    status: order.status
  }))

  res.json(payments)
})

module.exports = router
