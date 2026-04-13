const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('return/return', {
    title: 'Return Policy'
  });
});

module.exports = router;
