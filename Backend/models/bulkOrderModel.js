const mongoose = require('mongoose');

const bulkOrderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Please provide customer name'],
      trim: true,
    },
    mobileNo: {
      type: String,
      required: [true, 'Please provide mobile number'],
      trim: true,
    },
    parcelAddress: {
      type: String,
      required: [true, 'Please provide parcel address'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [1, 'Quantity must be at least 1'],
    },
    woodType: {
      type: String,
      required: [true, 'Please provide wood type'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Completed'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
