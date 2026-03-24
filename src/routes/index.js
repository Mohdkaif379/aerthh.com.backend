const express = require('express');
const homeRoutes = require('./home/home');

const router = express.Router();

// Mount route modules
router.use('/', homeRoutes);

module.exports = router;
