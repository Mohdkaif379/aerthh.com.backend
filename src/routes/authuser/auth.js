const express = require('express');
const router = express.Router();

// Use built-in fetch when available (Node 18+); otherwise fall back to node-fetch.
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

// Home page route with banners and categories
router.get('/signup', async (req, res) => {
  

  res.render('auth/signup', {
    title: 'Sign Up',
    message: 'Please sign up to continue'
  });
});

module.exports = router;
