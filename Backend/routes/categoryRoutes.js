const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

// GET all categories (public) / POST new category (admin only)
router.route('/')
  .get(getCategories)
  .post(protectAdmin, createCategory);

// PUT update / DELETE category (admin only)
router.route('/:id')
  .put(protectAdmin, updateCategory)
  .delete(protectAdmin, deleteCategory);

module.exports = router;
