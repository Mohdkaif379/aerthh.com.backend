const express = require('express');
const homeRoutes = require('./home/home');
const authRoutes = require('./authuser/customer/auth');
const buyRoutes = require('./products/buy');

const router = express.Router();

// Mount route modules
router.use('/', homeRoutes);
router.use('/auth', authRoutes);
router.use('/products', buyRoutes);

module.exports = router;
