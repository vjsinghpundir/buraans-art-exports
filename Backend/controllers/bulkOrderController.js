const BulkOrder = require('../models/bulkOrderModel');
const path = require('path');
const fs = require('fs');

const uploadBulkOrderPhoto = async (file, customerName = 'customer') => {
  const folderPath = path.join(__dirname, '../uploads/BulkOrders');

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const safeName = customerName.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() || 'customer';
  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const fileName = `${Date.now()}-${safeName}${ext}`;
  const uploadPath = path.join(folderPath, fileName);

  await file.mv(uploadPath);

  return `/uploads/BulkOrders/${fileName}`;
};

// @desc    Get all bulk orders
// @route   GET /api/bulk-orders
// @access  Admin
const getBulkOrders = async (req, res) => {
  try {
    const bulkOrders = await BulkOrder.find({}).sort({ createdAt: -1 });
    res.status(200).json(bulkOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bulk orders', error: error.message });
  }
};

// @desc    Create bulk order request
// @route   POST /api/bulk-orders
// @access  Public
const createBulkOrder = async (req, res) => {
  try {
    const { customerName, mobileNo, parcelAddress, quantity, woodType, notes } = req.body;

    if (!customerName || !mobileNo || !parcelAddress || !quantity || !woodType) {
      return res.status(400).json({
        message: 'Customer name, mobile number, parcel address, quantity, and wood type are required',
      });
    }

    let photo = '';

    if (req.files && (req.files.photo || req.files.orderPhoto)) {
      photo = await uploadBulkOrderPhoto(req.files.photo || req.files.orderPhoto, customerName);
    }

    const bulkOrder = await BulkOrder.create({
      customerName,
      mobileNo,
      parcelAddress,
      quantity: Number(quantity),
      woodType,
      notes: notes || '',
      photo,
    });

    res.status(201).json(bulkOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating bulk order', error: error.message });
  }
};

// @desc    Update bulk order status
// @route   PUT /api/bulk-orders/:id/status
// @access  Admin
const updateBulkOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['New', 'Contacted', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid bulk order status' });
    }

    const bulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!bulkOrder) {
      return res.status(404).json({ message: 'Bulk order not found' });
    }

    res.status(200).json(bulkOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating bulk order', error: error.message });
  }
};

module.exports = {
  getBulkOrders,
  createBulkOrder,
  updateBulkOrderStatus,
};
