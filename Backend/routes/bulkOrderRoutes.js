const express = require('express');
const router = express.Router();
const {
  getBulkOrders,
  createBulkOrder,
  updateBulkOrderStatus,
} = require('../controllers/bulkOrderController');

router.route('/')
  .get(getBulkOrders)
  .post(createBulkOrder);

router.route('/:id/status')
  .put(updateBulkOrderStatus);

module.exports = router;
