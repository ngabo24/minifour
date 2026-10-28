const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' }
  },
  { _id: false }
)

const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zip: { type: String, required: true }
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestName: { type: String, default: '' },
    tableNumber: { type: Number, default: null },
    momoPhone: { type: String, default: '' },
    items: [orderItemSchema],
    deliveryFee: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    totalCost: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'Pay now (manual)' },
    paymentStatus: { type: String, enum: ['unpaid', 'pending_confirmation', 'paid', 'manual_paid', 'cancelled', 'failed'], default: 'pending_confirmation' },
    paymentReference: { type: String, default: '' },
    address: { type: addressSchema, required: true },
    status: { type: String, enum: ['pending', 'awaiting_approval', 'approved', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'], default: 'awaiting_approval' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    approvalNote: { type: String, default: '' },
    ebmRcptNo: { type: String, default: '' },
    ebmIntrlData: { type: String, default: '' },
    ebmRcptSign: { type: String, default: '' },
    ebmSdcId: { type: String, default: '' },
    ebmMrcNo: { type: String, default: '' },
    ebmSyncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
    ebmError: { type: String, default: '' },
    ebmSyncedAt: { type: Date }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)
