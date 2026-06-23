const Category = require('../models/categoryModel');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: `Category "${name}" already exists` });
    }

    const category = await Category.create({ name: name.trim() });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name conflicts with another category
    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ message: `Category "${name}" already exists` });
    }

    category.name = name.trim();
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.deleteOne();
    res.status(200).json({ message: 'Category deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
