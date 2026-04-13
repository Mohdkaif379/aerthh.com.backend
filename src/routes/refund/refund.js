const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('refund/refund', {
    title: 'Refund Policy'
  });
});

module.exports = router;
