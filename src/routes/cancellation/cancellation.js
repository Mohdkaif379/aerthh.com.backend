const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('cancellation/cancellation', {
    title: 'Cancellation Policy'
  });
});

module.exports = router;
