const User = require('../../models/User')
const Product = require('../../models/Product')
const Table = require('../../models/Table')

const CLIENT_PASSWORD = 'Client@Pass123'
const ADMIN_PASSWORD = 'Admin@Pass123'
const CHEF_PASSWORD = 'Chef@Pass123'

const createUser = async ({ name, email, password, role = 'client' }) => {
  const user = await User.create({ name, email, password, role })
  return user
}

const createAdmin = async (email = 'admin@test.minifour.com') =>
  createUser({ name: 'Admin Tester', email, password: ADMIN_PASSWORD, role: 'admin' })

const createChef = async (email = 'chef@test.minifour.com') =>
  createUser({ name: 'Chef Tester', email, password: CHEF_PASSWORD, role: 'chef' })

const createClient = async (email = 'client@test.minifour.com') =>
  createUser({ name: 'Client Tester', email, password: CLIENT_PASSWORD, role: 'client' })

const createProduct = async (overrides = {}) => {
  const defaults = {
    name: 'Rubis Box',
    description: 'Red rice, plantains, and chicken.',
    price: 8500,
    costPrice: 4000,
    category: 'Main Dishes Combo',
    image: 'menu-chicken-rice.webp',
    stock: 30,
  }

  return Product.create({ ...defaults, ...overrides })
}

const createTable = async (number = 1) => Table.create({ number, name: `Table ${number}`, active: true })

const guestAddress = (tableNumber) => ({
  firstName: 'Guest',
  lastName: `Table ${tableNumber}`,
  email: `guest-table-${tableNumber}@minifour.local`,
  street: `Table ${tableNumber}`,
  city: 'Restaurant',
  country: 'Local',
  zip: `T-${tableNumber}`,
})

const guestEmail = (tableNumber) => `guest-table-${tableNumber}@minifour.local`

module.exports = {
  ADMIN_PASSWORD,
  CHEF_PASSWORD,
  CLIENT_PASSWORD,
  createAdmin,
  createChef,
  createClient,
  createProduct,
  createTable,
  createUser,
  guestAddress,
  guestEmail,
}
