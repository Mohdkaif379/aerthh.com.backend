const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('contactus/contact', {
    title: 'Contact Us'
  });
});

module.exports = router;
