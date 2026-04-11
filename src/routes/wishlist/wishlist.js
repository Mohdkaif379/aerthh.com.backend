const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('wishlist/wishlist', {
    title: 'Wishlist'
  });
});

module.exports = router;
