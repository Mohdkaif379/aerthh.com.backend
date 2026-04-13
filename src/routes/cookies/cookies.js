const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('cookies/cookies', {
    title: 'Cookies Policy'
  });
});

module.exports = router;
