const express = require('express')
const Product = require('../models/Product')

const router = express.Router()

router.get('/', async (req, res) => {
  const { category } = req.query
  const filter = category && category !== 'All' ? { category } : {}

  const products = await Product.find(filter).sort({ category: 1, name: 1 })
  res.json(products)
})

router.get('/categories', async (req, res) => {
  const categories = await Product.distinct('category')
  res.json(categories)
})

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  res.json(product)
})

module.exports = router
