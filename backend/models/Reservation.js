const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    tableNumber: { type: Number, default: null },
    partySize: { type: Number, required: true, min: 1 },
    reservationDate: { type: String, required: true },
    reservationTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'arrived', 'seated', 'cancelled'],
      default: 'pending'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Reservation', reservationSchema)
