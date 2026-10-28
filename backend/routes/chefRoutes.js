const express = require('express')
const Order = require('../models/Order')
const protect = require('../middleware/authMiddleware')
const chefOnly = require('../middleware/chefMiddleware')

const router = express.Router()

router.use(protect)
router.use(chefOnly)

router.get('/orders', async (req, res) => {
  const orders = await Order.find({
    status: { $in: ['approved', 'confirmed', 'preparing', 'ready'] }
  }).populate('user', 'name email').sort({ createdAt: -1 })
  res.json(orders)
})

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['preparing', 'ready', 'served', 'cancelled']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' })
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  order.status = status
  if (status === 'cancelled') {
    order.paymentStatus = 'cancelled'
  }

  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

router.put('/orders/:id/payment-confirm', async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  if (order.paymentMethod === 'MTN Mobile Money') {
    return res.status(409).json({ message: 'MTN Mobile Money payments are confirmed directly by the provider.' })
  }

  order.paymentStatus = 'paid'
  order.paymentMethod = 'Mobile Money'
  order.paymentReference = order.paymentReference || 'MM-ACK'

  if (['pending', 'confirmed'].includes(order.status)) {
    order.status = 'preparing'
  }

  await order.save()

  const io = req.app.get('io')
  io?.emit('order:updated', order)
  io?.to('chef-room').emit('order:updated', order)

  res.json(order)
})

module.exports = router
