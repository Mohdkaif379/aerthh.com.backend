const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('terms/terms', {
    title: 'Terms & Conditions'
  });
});

module.exports = router;
