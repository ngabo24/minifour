const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const http = require('http')
const express = require('express')
const cors = require('cors')
const QRCode = require('qrcode')
const { Server } = require('socket.io')
const connectDB = require('./config/db')
const { seedProducts } = require('./seed')
const productRoutes = require('./routes/productRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const orderRoutes = require('./routes/orderRoutes')
const adminRoutes = require('./routes/adminRoutes')
const chefRoutes = require('./routes/chefRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const Table = require('./models/Table')

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

const express = require('express')
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
})

app.set('io', io)
app.use(cors())
app.use(express.json())

io.on('connection', (socket) => {
  socket.on('join-chef-room', () => {
    socket.join('chef-room')
  })
})

const ensureDefaultIngredients = async () => {
  const Ingredient = require('./models/Ingredient')
  const defaults = [
    { name: 'Tomato', category: 'vegetable', unit: 'pcs', stock: 120, costPerUnit: 0.45, minimumLevel: 25 },
    { name: 'Onion', category: 'vegetable', unit: 'pcs', stock: 100, costPerUnit: 0.35, minimumLevel: 20 },
    { name: 'Lettuce', category: 'vegetable', unit: 'heads', stock: 50, costPerUnit: 0.9, minimumLevel: 12 },
    { name: 'Chicken', category: 'protein', unit: 'kg', stock: 22, costPerUnit: 4.8, minimumLevel: 8 },
    { name: 'Cheese', category: 'dairy', unit: 'kg', stock: 18, costPerUnit: 3.2, minimumLevel: 6 },
    { name: 'Pasta', category: 'grain', unit: 'kg', stock: 20, costPerUnit: 2.5, minimumLevel: 8 },
    { name: 'Rice', category: 'grain', unit: 'kg', stock: 28, costPerUnit: 1.8, minimumLevel: 10 }
  ]

  const existingIngredients = await Ingredient.countDocuments()
  if (existingIngredients === 0) {
    await Ingredient.insertMany(defaults)
    console.log('Seeded default ingredient stock records.')
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minifour API is running' })
})

app.get('/api/tables/validate', async (req, res) => {
  const { table } = req.query
  const parsedNumber = Number(table)

  if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
    return res.status(400).json({ message: 'A valid table number is required.' })
  }

  const tableRecord = await Table.findOne({ number: parsedNumber, active: true }).lean()
  if (!tableRecord) {
    return res.status(404).json({ message: 'This table is not available for guest access.' })
  }

  res.json({
    valid: true,
    tableNumber: tableRecord.number,
    tableName: tableRecord.name,
    expiresAt: Date.now() + 60 * 60 * 1000,
  })
})

app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chef', chefRoutes)

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ message: error.message || 'Internal Server Error' })
})

const ensureDefaultTables = async () => {
  const defaultTables = [1, 2, 3, 4, 5, 6]
  const existingTables = await Table.find().sort({ number: 1 })

  for (const table of existingTables) {
    if (!table.qrCodeUrl || !table.qrCodeUrl.startsWith('data:image')) {
      table.qrCodeUrl = await buildTableQrCodeUrl(table.number)
      await table.save()
    }
  }

  if (existingTables.length === 0) {
    const rows = []

    for (const number of defaultTables) {
      rows.push({
        number,
        name: `Table ${number}`,
        active: true,
        qrCodeUrl: await buildTableQrCodeUrl(number),
      })
    }

    await Table.insertMany(rows)
    console.log('Created default restaurant tables.')
  }
}

const ensureDefaultAdmin = async () => {
  const User = require('./models/User')
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@minifour.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Minifour123'

  const existingAdmin = await User.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    })
    console.log(`Created default admin account: ${adminEmail} / ${adminPassword}`)
  } else {
    const needsPasswordUpdate = !(await existingAdmin.comparePassword(adminPassword))
    if (needsPasswordUpdate) {
      existingAdmin.password = adminPassword
      existingAdmin.role = 'admin'
      await existingAdmin.save()
      console.log(`Updated default admin password to the secure value for ${adminEmail}.`)
    }
  }

  const chefEmail = process.env.CHEF_EMAIL || 'chef@minifour.com'
  const chefPassword = process.env.CHEF_PASSWORD || 'Chef@Minifour123'

  const existingChef = await User.findOne({ email: chefEmail })
  if (!existingChef) {
    await User.create({
      name: 'Kitchen Chef',
      email: chefEmail,
      password: chefPassword,
      role: 'chef'
    })
    console.log(`Created default chef account: ${chefEmail} / ${chefPassword}`)
  } else {
    const needsPasswordUpdate = !(await existingChef.comparePassword(chefPassword))
    if (needsPasswordUpdate) {
      existingChef.password = chefPassword
      existingChef.role = 'chef'
      await existingChef.save()
      console.log(`Updated default chef password to the secure value for ${chefEmail}.`)
    }
  }
}

const startServer = async () => {
  try {
    await connectDB()
    const Product = require('./models/Product')
    const count = await Product.countDocuments()

    if (count === 0) {
      await seedProducts({ closeConnectionAfter: false })
    }

    await ensureDefaultAdmin()
    await ensureDefaultIngredients()
    await ensureDefaultTables()

    const port = process.env.PORT || 5000
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
module.exports = app;
