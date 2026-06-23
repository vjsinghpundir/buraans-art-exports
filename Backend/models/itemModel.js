const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an item name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide an item SKU (Stock Keeping Unit)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide an item price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 100,
    },
    image: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
