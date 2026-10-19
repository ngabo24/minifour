const mongoose = require('mongoose')

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1 },
    name: { type: String, default: 'Table' },
    active: { type: Boolean, default: true },
    qrCodeUrl: { type: String, default: '' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Table', tableSchema)
