const Item = require('../models/itemModel');
const path = require('path');
const fs = require('fs');

/**
 * Save an uploaded file inside uploads/{category}/{sku[-index]}.ext
 * @param {object} file     - express-fileupload file object
 * @param {string} category - product category (used as folder name)
 * @param {string} sku      - product SKU (used as base file name)
 * @param {number|null} index - gallery index (null for main image)
 */
const uploadFile = async (file, category = 'General', sku = 'product', index = null) => {
  // Sanitize the category name to make a safe folder name
  const safeCategory = category.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

  // Sanitize the SKU to make a safe file name
  const safeSku = sku.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();

  // Build folder path: uploads/{Category}/
  const folderPath = path.join(__dirname, '../uploads', safeCategory);

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Extract original file extension (.jpg, .png, .webp, etc.)
  const ext = path.extname(file.name).toLowerCase() || '.jpg';

  // Build filename: SKU.ext  OR  SKU-1.ext, SKU-2.ext for gallery
  const fileName = index !== null ? `${safeSku}-${index}${ext}` : `${safeSku}${ext}`;

  const uploadPath = path.join(folderPath, fileName);
  await file.mv(uploadPath);

  return `/uploads/${safeCategory}/${fileName}`;
};

const normalizeFiles = (files) => {
  if (!files) return [];
  return Array.isArray(files) ? files : [files];
};

const deleteUploadedFile = (filePath) => {
  if (!filePath || !filePath.startsWith('/uploads/')) return;
  fs.unlink(path.join(__dirname, '..', filePath), (err) => {
    if (err) console.error(`Error deleting uploaded file: ${err.message}`);
  });
};

// @desc    Get all items
// @route   GET /api/items
// @access  Public
const getItems = async (req, res) => {
  try {
    const items = await Item.find({}).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving items', error: error.message });
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving item', error: error.message });
  }
};

// @desc    Create a new item
// @route   POST /api/items
// @access  Public
const createItem = async (req, res) => {
  try {
    const { name, sku, description, price, category } = req.body;
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : 100;

    if (!name || !sku || price === undefined) {
      return res.status(400).json({ message: 'Please provide name, sku, and price' });
    }

    // Check if item with SKU already exists
    const existingItem = await Item.findOne({ sku: sku.toUpperCase() });
    if (existingItem) {
      return res.status(400).json({ message: `Item with SKU ${sku} already exists` });
    }

    let image = '';
    const images = [];

    if (req.files && (req.files.mainImage || req.files.image)) {
      image = await uploadFile(req.files.mainImage || req.files.image, category, sku);
    }

    if (req.files && req.files.galleryImages) {
      const galleryFiles = normalizeFiles(req.files.galleryImages);
      for (let i = 0; i < galleryFiles.length; i++) {
        images.push(await uploadFile(galleryFiles[i], category, sku, i + 1));
      }
    }

    const newItem = await Item.create({
      name,
      sku,
      description,
      price,
      category,
      stock,
      image: image || images[0] || '',
      images,
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating item', error: error.message });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Public
const updateItem = async (req, res) => {
  try {
    const { name, sku, description, price, category } = req.body;
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : 100;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // If SKU is being updated, verify it is unique
    if (sku && sku.toUpperCase() !== item.sku) {
      const existingSku = await Item.findOne({ sku: sku.toUpperCase() });
      if (existingSku) {
        return res.status(400).json({ message: `SKU ${sku} is already in use by another item` });
      }
    }

    const updatedFields = { name, sku, description, price, category, stock };

    const effectiveCategory = (category || item.category || 'General');
    const effectiveSku = (sku || item.sku || 'product');

    if (req.files && (req.files.mainImage || req.files.image)) {
      updatedFields.image = await uploadFile(req.files.mainImage || req.files.image, effectiveCategory, effectiveSku);
      deleteUploadedFile(item.image);
    }

    if (req.files && req.files.galleryImages) {
      const galleryFiles = normalizeFiles(req.files.galleryImages);
      const galleryImages = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        galleryImages.push(await uploadFile(galleryFiles[i], effectiveCategory, effectiveSku, i + 1));
      }
      updatedFields.images = galleryImages;
      (item.images || []).forEach(deleteUploadedFile);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating item', error: error.message });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Public
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete uploaded photos from disk if they exist
    deleteUploadedFile(item.image);
    (item.images || []).forEach(deleteUploadedFile);

    await item.deleteOne();
    res.status(200).json({ message: 'Item deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
