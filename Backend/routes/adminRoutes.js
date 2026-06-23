const express = require('express');
const router = express.Router();
const { adminLogin, verifyAdmin } = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

// POST /api/admin/login
router.post('/login', adminLogin);

// GET /api/admin/verify  (protected)
router.get('/verify', protectAdmin, verifyAdmin);

module.exports = router;
