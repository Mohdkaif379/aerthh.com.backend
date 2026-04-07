const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('cart/cart', {
    title: 'Cart'
  });
});

router.get('/address', (req, res) => {
  res.redirect('/products/address?cart=1');
});

router.get('/checkout', (req, res) => {
  res.redirect('/checkout?cart=1');
});

module.exports = router;
