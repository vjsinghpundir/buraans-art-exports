const mongoose = require('mongoose');
const Admin = require('../models/adminModel');
const Category = require('../models/categoryModel');

const DEFAULT_CATEGORIES = [
  'General', 'Sofa', 'Dining', 'Bedroom', 'Chair', 'Storage', 'Stool', 'Table'
];

const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'buraans@2026';
      await Admin.create({ username, password });
      console.log(`Admin account seeded successfully: Username = ${username}`);
    } else {
      console.log('Admin account already exists in the database.');
    }
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
  }
};

const seedCategories = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
      console.log(`Default categories seeded: ${DEFAULT_CATEGORIES.join(', ')}`);
    } else {
      console.log(`Categories already exist in the database (${categoryCount} found).`);
    }
  } catch (error) {
    console.error(`Error seeding categories: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
    await seedCategories();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
