const mongoose = require('mongoose')

const ingredientUseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'pcs' }
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true },
    image: { type: String, default: 'default.png' },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    ingredients: [ingredientUseSchema]
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)
