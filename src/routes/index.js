const express = require('express');
const homeRoutes = require('./home/home');
const authRoutes = require('./authuser/customer/auth');
const buyRoutes = require('./products/buy');
const checkoutRoutes = require('./checkout/checkout');
const orderRoutes = require('./order/order');
const router = express.Router();

// Mount route modules
router.use('/', homeRoutes);
router.use('/auth', authRoutes);
router.use('/products', buyRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
