const express = require('express');
const homeRoutes = require('./home/home');
const authRoutes = require('./authuser/customer/auth');

const router = express.Router();

// Mount route modules
router.use('/', homeRoutes);
router.use('/auth', authRoutes);

module.exports = router;
