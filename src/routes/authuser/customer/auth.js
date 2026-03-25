const express = require('express');
const router = express.Router();

// Use built-in fetch when available (Node 18+); otherwise fall back to node-fetch.
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

// Customer auth pages
router.get('/customer/signup', async (req, res) => {
  res.render('auth/customer/signup', {
    title: 'Sign Up',
    message: 'Please sign up to continue'
  });
});

router.get('/customer/signin', async (req, res) => {
  res.render('auth/customer/signin', {
    title: 'Sign In',
    message: 'Please sign in to continue'
  });
});

module.exports = router;
