const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const QRCode = require('qrcode')
const { Server } = require('socket.io')
const { loadEnv } = require('./config/env')

loadEnv()

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
const flyerProducts = require('./data/products')

const ensureFlyerMenu = async () => {
  const legacyNames = [
    'Greek salad', 'Veg salad', 'Clover Salad', 'Chicken Salad', 'Lasagna Rolls', 'Peri Peri Rolls', 'Chicken Rolls', 'Veg Rolls',
    'Ripple Ice Cream', 'Fruit Ice Cream', 'Jar Ice Cream', 'Vanilla Ice Cream', 'Chicken Sandwich', 'Vegan Sandwich', 'Grilled Sandwich', 'Bread Sandwich',
    'Cup Cake', 'Vegan Cake', 'Butterscotch Cake', 'Sliced Cake', 'Sushi Combo', 'Mushroom Pasta', 'Tomato Pasta', 'Spaghetti Delight',
    'Veg Noodles', 'Sesame Noodles', 'Prawn Noodles', 'Hot Noodles', 'Veg Bowl', 'Green Feast', 'Garden Bowl', 'Pure Veg Wrap',
  ]
  const Product = require('./models/Product')
  const legacyFilter = {
    name: { $in: legacyNames },
    image: /^food_\d+\.png$/,
  }
  const legacyCount = await Product.countDocuments(legacyFilter)

  if (legacyCount !== legacyNames.length) return

  await Product.deleteMany(legacyFilter)
  await Product.insertMany(flyerProducts)
  console.log(`Replaced ${legacyCount} legacy sample products with the flyer menu.`)
}

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

const app = express()
const server = http.createServer(app)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://minifour.vercel.app',
  'https://minifour-frontend.vercel.app',
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((origin) => String(origin).split(',').map((entry) => entry.trim()))
  .filter((origin) => /^https?:\/\//.test(origin))

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
    if (!origin) {
      return callback(null, true)
    }

    // Check against allowed origins
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes(origin.replace(/\/+$/, '')) ||
      allowedOrigins.some((allowed) => origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, '')))
    ) {
      return callback(null, true)
    }

    // In production on Vercel, also allow any vercel.app subdomain
    if (process.env.NODE_ENV === 'production' && /\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }

    callback(new Error('CORS policy denied this origin'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes(origin.replace(/\/+$/, '')) ||
        (process.env.NODE_ENV === 'production' && /\.vercel\.app$/.test(origin))
      ) {
        return callback(null, true)
      }
      callback(new Error('CORS policy denied this origin'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
})

app.set('io', io)
app.set('trust proxy', 1)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))
// Enable CORS for all requests
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV === 'production' && /\.vercel\.app$/.test(origin))
  ) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait before trying again.' },
})

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: Number(process.env.ORDER_RATE_LIMIT_MAX || 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many orders were submitted. Please wait before trying again.' },
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/orders', orderLimiter)

let databaseReadyPromise = null

// Connects to MongoDB exactly once per process. Serverless runtimes re-use the
// same module instance across invocations, so the promise is cached to avoid
// opening a new connection pool on every request.
const ensureDatabaseReady = () => {
  if (!databaseReadyPromise) {
    databaseReadyPromise = connectDB().catch((error) => {
      databaseReadyPromise = null
      throw error
    })
  }

  return databaseReadyPromise
}

app.use('/api', async (req, res, next) => {
  try {
    await ensureDatabaseReady()
    next()
  } catch (error) {
    console.error('Database connection failed:', error.message)
    res.status(503).json({ message: 'The database is unavailable. Please try again shortly.' })
  }
})

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
    await ensureDatabaseReady()
    const Product = require('./models/Product')
    const count = await Product.countDocuments()

    if (count === 0) {
      await seedProducts({ closeConnectionAfter: false })
    }

    await ensureFlyerMenu()
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

if (require.main === module) {
  startServer()
}

// Vercel (and any other serverless runtime) imports this file and expects the
// Express application itself to be exported.
module.exports = app
module.exports.app = app
module.exports.server = server
module.exports.ensureDatabaseReady = ensureDatabaseReady
