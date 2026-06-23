const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    Description: { type: String, required: true, trim: true },
    HSCODE: { type: String, trim: true },
    QTY: { type: Number, default: 0 },
    PRICE: { type: Number, default: 0 },
    GST: { type: Number, default: 0 },
    IGST: { type: Number, default: 0 },
    Total: { type: Number, default: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    bill_no: { type: String, required: [true, 'Invoice number is required'], trim: true, unique: true },
    bill_date: { type: Date, required: [true, 'Invoice date is required'] },
    party_name: { type: String, required: [true, 'Customer name is required'], trim: true },
    party_address: { type: String, trim: true },
    party_gst: { type: String, trim: true },
    party_phone: { type: String, trim: true },
    party_email: { type: String, trim: true },
    subtotal: { type: Number, default: 0 },
    SGST: { type: Number, default: 0 },
    CGST: { type: Number, default: 0 },
    IGST: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    Billing_data: [billItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bill', billSchema);
