const express = require('express')
const { randomUUID } = require('crypto')
const Order = require('../models/Order')
const Product = require('../models/Product')
const protect = require('../middleware/authMiddleware')
const { optionalAuth } = require('../middleware/authMiddleware')
const mtnMomo = require('../services/mtnMomo')

const router = express.Router()

const isGuestOrder = (order) => !order.user && Boolean(order.tableNumber)

const canManageOrder = (req, order) => {
  if (req.user) {
    if (req.user.role === 'admin' || req.user.role === 'chef') return true
    return String(order.user) === String(req.user._id)
  }

  const guestEmail = String(req.query?.guestEmail || req.body?.guestEmail || '').trim().toLowerCase()
  if (!guestEmail || !isGuestOrder(order)) return false

  return guestEmail === `guest-table-${order.tableNumber}@minifour.local`
}

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

router.post('/', optionalAuth, async (req, res) => {
  const { items, address, paymentMethod, tableNumber, guestName, momoPhone } = req.body

  if (!items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Cart items are required.' })
  }

  if (!address || !address.firstName || !address.lastName || !address.email || !address.street || !address.city || !address.country || !address.zip) {
    return res.status(400).json({ message: 'Delivery address is required.' })
  }

  if (paymentMethod === 'MTN Mobile Money' && !mtnMomo.isConfigured()) {
    return res.status(503).json({ message: 'MTN MoMo is not configured. Add the MTN MoMo credentials and currency to backend/.env.' })
  }

  if (paymentMethod === 'MTN Mobile Money' && !mtnMomo.isValidPhoneNumber(momoPhone)) {
    return res.status(400).json({ message: 'Enter a valid mobile number with its country code.' })
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
  const deliveryFee = tableNumber ? 0 : (subtotal > 0 ? 2000 : 0)
  const totalCost = productLookup.reduce((total, item) => total + Number(item.costPrice) * Number(item.quantity), 0)

  const parsedTableNumber = tableNumber ? Number(tableNumber) : null
  if (!req.user && parsedTableNumber) {
    const guestEmail = String(address?.email || '').trim().toLowerCase()
    const expectedGuestEmail = `guest-table-${parsedTableNumber}@minifour.local`
    if (guestEmail !== expectedGuestEmail) {
      return res.status(403).json({ message: 'Guest table orders must use the table-scoped guest email.' })
    }
  }

  const resolvePaymentMethod = paymentMethod || 'MTN Mobile Money'
  const initialPaymentStatus = resolvePaymentMethod === 'MTN Mobile Money'
    ? 'pending_confirmation'
    : resolvePaymentMethod === 'Cash on delivery'
      ? 'unpaid'
      : 'pending_confirmation'
  const paymentReference = resolvePaymentMethod === 'MTN Mobile Money' ? randomUUID() : ''

  const order = await Order.create({
    user: req.user ? req.user._id : undefined,
    guestName: guestName || `${address.firstName} ${address.lastName}`,
    tableNumber: tableNumber ? Number(tableNumber) : null,
    momoPhone: resolvePaymentMethod === 'MTN Mobile Money' ? mtnMomo.normalizePhoneNumber(momoPhone) : '',
    paymentMethod: resolvePaymentMethod,
    paymentStatus: initialPaymentStatus,
    paymentReference,
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

  let paymentInitiationError = ''
  if (resolvePaymentMethod === 'MTN Mobile Money') {
    try {
      await mtnMomo.requestToPay({
        amount: order.total,
        phoneNumber: momoPhone,
        externalId: order._id,
        referenceId: paymentReference,
      })
    } catch (error) {
      console.error('MTN MoMo payment request failed:', error.message)
      order.paymentStatus = 'failed'
      await order.save()
      paymentInitiationError = 'The MTN payment request could not be started. Please place the order again or contact the restaurant.'
    }
  }

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.status(201).json({
    message: 'Order placed successfully.',
    order,
    paymentInitiationError,
  })
})

router.put('/:id/payment', optionalAuth, async (req, res) => {
  const { paymentStatus, paymentReference, paymentMethod, momoPhone } = req.body || {}

  const allowedStatuses = ['pending_confirmation', 'paid', 'manual_paid', 'unpaid', 'cancelled', 'failed']
  if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'A valid payment status is required.' })
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  if (!canManageOrder(req, order)) {
    return res.status(403).json({ message: 'You are not allowed to update this order.' })
  }

  if (paymentMethod) order.paymentMethod = paymentMethod
  if (paymentReference) order.paymentReference = paymentReference
  if (momoPhone !== undefined) {
    if (momoPhone && !mtnMomo.isValidPhoneNumber(momoPhone)) {
      return res.status(400).json({ message: 'Enter a valid mobile number with its country code.' })
    }
    order.momoPhone = momoPhone ? mtnMomo.normalizePhoneNumber(momoPhone) : ''
  }

  order.paymentStatus = paymentStatus

  if (paymentStatus === 'paid' && ['pending', 'confirmed'].includes(order.status)) {
    order.status = 'preparing'
  }

  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

router.get('/:id/momo-status', optionalAuth, async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  if (!canManageOrder(req, order)) {
    return res.status(403).json({ message: 'You are not allowed to view this order.' })
  }

  if (order.paymentMethod !== 'MTN Mobile Money') {
    return res.status(400).json({ message: 'This order does not use MTN Mobile Money.' })
  }

  if (['paid', 'failed', 'cancelled'].includes(order.paymentStatus)) {
    return res.json({ paymentStatus: order.paymentStatus, orderStatus: order.status })
  }

  try {
    const payment = await mtnMomo.getRequestToPayStatus(order.paymentReference)
    if (payment.status === 'SUCCESSFUL') {
      order.paymentStatus = 'paid'
      if (['pending', 'confirmed'].includes(order.status)) order.status = 'preparing'
    } else if (payment.status === 'FAILED') {
      order.paymentStatus = 'failed'
    }

    await order.save()

    const io = req.app.get('io')
    io?.emit('order:updated', order)
    io?.to('chef-room').emit('order:updated', order)

    res.json({ paymentStatus: order.paymentStatus, orderStatus: order.status })
  } catch (error) {
    console.error('MTN MoMo status lookup failed:', error.message)
    res.status(502).json({ message: 'Unable to verify the MTN payment right now.' })
  }
})

module.exports = router
