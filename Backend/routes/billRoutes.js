const express = require('express');
const router = express.Router();
const {
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
} = require('../controllers/billController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protectAdmin, getBills)
  .post(protectAdmin, createBill);

router.route('/:id')
  .get(protectAdmin, getBillById)
  .put(protectAdmin, updateBill)
  .delete(protectAdmin, deleteBill);

module.exports = router;
