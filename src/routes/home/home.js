const express = require('express');
const router = express.Router();

// Use built-in fetch when available (Node 18+); otherwise fall back to node-fetch.
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

// Home page route with banners and categories
router.get('/', async (req, res) => {
  const baseUrl = process.env.BASE_URL || '';
  let banners = [];

  if (baseUrl) {
    try {
      const resp = await fetchFn(`${baseUrl}banners`);
      if (resp.ok) {
        banners = await resp.json();
      }
    } catch (err) {
      console.error('Error fetching banners:', err.message || err);
    }
  }

  res.render('home/home', {
    title: 'Home Page',
    message: 'Hello from routes!',
    banners: banners || [],
    categories: [], // categories will be fetched client-side now
    apiBase: baseUrl
  });
});

module.exports = router;
