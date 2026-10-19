const express = require('express')
const Order = require('../models/Order')
const Product = require('../models/Product')
const protect = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
})

router.get('/guest', async (req, res) => {
  const { email, tableNumber } = req.query

  if (!email && !tableNumber) {
    return res.status(400).json({ message: 'Email or table number is required.' })
  }

  const normalizedEmail = String(email || '').trim().toLowerCase()
  const parsedTable = Number(tableNumber)

  if (!Number.isInteger(parsedTable) || parsedTable < 1) {
    return res.status(400).json({ message: 'A valid table number is required.' })
  }

  const expectedGuestEmail = `guest-table-${parsedTable}@minifour.local`
  if (normalizedEmail && normalizedEmail !== expectedGuestEmail) {
    return res.status(403).json({ message: 'This guest account is not authorized for this table.' })
  }

  const orders = await Order.find({
    tableNumber: parsedTable,
    'address.email': expectedGuestEmail,
  }).sort({ createdAt: -1 })

  res.json(orders)
})

router.post('/', async (req, res) => {
  const { items, address, paymentMethod, tableNumber, guestName, paymentStatus, paymentReference } = req.body

  if (!items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Cart items are required.' })
  }

  if (!address || !address.firstName || !address.lastName || !address.email || !address.street || !address.city || !address.country || !address.zip) {
    return res.status(400).json({ message: 'Delivery address is required.' })
  }

  const productLookup = await Promise.all(
    items.map(async (item) => {
      const productDoc = await Product.findById(item.product).lean()
      return {
        ...item,
        costPrice: Number(productDoc?.costPrice || 0)
      }
    })
  )

  const subtotal = productLookup.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0)
  const deliveryFee = tableNumber ? 0 : subtotal > 0 ? 2 : 0
  const totalCost = productLookup.reduce((total, item) => total + Number(item.costPrice) * Number(item.quantity), 0)

  const parsedTableNumber = tableNumber ? Number(tableNumber) : null
  if (!req.user && parsedTableNumber) {
    const guestEmail = String(address?.email || '').trim().toLowerCase()
    const expectedGuestEmail = `guest-table-${parsedTableNumber}@minifour.local`
    if (guestEmail !== expectedGuestEmail) {
      return res.status(403).json({ message: 'Guest table orders must use the table-scoped guest email.' })
    }
  }

  const normalizedPaymentStatus = paymentStatus === 'paid' || paymentMethod === 'Pay now (manual)' ? 'pending_confirmation' : paymentStatus || 'pending_confirmation'
  const resolvePaymentMethod = paymentMethod || 'Mobile Money'

  const order = await Order.create({
    user: req.user ? req.user._id : undefined,
    guestName: guestName || `${address.firstName} ${address.lastName}`,
    tableNumber: tableNumber ? Number(tableNumber) : null,
    paymentMethod: resolvePaymentMethod,
    paymentStatus: normalizedPaymentStatus,
    paymentReference: paymentReference || '',
    items: productLookup.map((item) => ({
      product: item.product,
      name: item.name,
      price: Number(item.price),
      costPrice: Number(item.costPrice),
      quantity: Number(item.quantity),
      image: item.image || ''
    })),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    totalCost,
    address,
    status: 'pending'
  })

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.status(201).json({
    message: 'Order placed successfully.',
    order
  })
})

router.put('/:id/payment', async (req, res) => {
  const { paymentStatus, paymentReference, paymentMethod } = req.body
  const allowedStatuses = ['pending_confirmation', 'paid', 'cancelled']

  if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'A valid payment status is required.' })
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  order.paymentStatus = paymentStatus
  if (paymentMethod) order.paymentMethod = paymentMethod
  if (paymentReference) order.paymentReference = paymentReference

  if (paymentStatus === 'paid' && ['pending', 'confirmed'].includes(order.status)) {
    order.status = 'preparing'
  }

  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

module.exports = router
