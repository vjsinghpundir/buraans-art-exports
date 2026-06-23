const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find admin in database
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
    }

    // Validate password using the instance method comparePassword
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
    }

    // Generate JWT Token (expires in 24 hours)
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, username: admin.username, role: 'admin' },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Verify Admin Token
// @route   GET /api/admin/verify
// @access  Private
const verifyAdmin = async (req, res) => {
  res.status(200).json({ message: 'Token is valid', admin: req.admin });
};

module.exports = { adminLogin, verifyAdmin };
