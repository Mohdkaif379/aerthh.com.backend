const express = require('express');
const homeRoutes = require('./home/home');
const authRoutes = require('./authuser/customer/auth');
const vendorRoutes = require('./authuser/vendor/vendor');
const buyRoutes = require('./products/buy');
const checkoutRoutes = require('./checkout/checkout');
const orderRoutes = require('./order/order');
const cartRoutes = require('./cart/cart');
const wishlistRoutes = require('./wishlist/wishlist');
const router = express.Router();

// Mount route modules
router.use('/', homeRoutes);
router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', buyRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);

module.exports = router;
