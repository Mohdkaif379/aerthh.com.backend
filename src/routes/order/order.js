const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('orders/order', {
    title: 'Orders'
  });
});

module.exports = router;
