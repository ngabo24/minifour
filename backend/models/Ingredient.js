const mongoose = require('mongoose')

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'general' },
    unit: { type: String, default: 'pcs' },
    stock: { type: Number, default: 0, min: 0 },
    costPerUnit: { type: Number, default: 0, min: 0 },
    minimumLevel: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Ingredient', ingredientSchema)
