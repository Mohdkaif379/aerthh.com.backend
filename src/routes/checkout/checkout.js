const express = require('express');

const router = express.Router();
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

async function fetchSingleProduct(productId) {
  const baseUrl = process.env.BASE_URL || 'https://aerthh.newhopeindia17.com/api/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const response = await fetchFn(`${normalizedBaseUrl}products/${productId}`);
  const data = await response.json();

  if (!response.ok || !data?.status) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data.data || null;
}

router.get('/', async (req, res) => {
  const productId = String(req.query.id || '').trim();
  const qty = Math.max(Number(req.query.qty || 1), 1);
  let product = null;
  let errorMessage = '';

  if (!productId) {
    errorMessage = 'Product id is required.';
  } else {
    try {
      product = await fetchSingleProduct(productId);
    } catch (error) {
      console.error('Error fetching product for checkout:', error.message || error);
      errorMessage = error.message || 'Failed to fetch product.';
    }
  }

  res.render('checkout/checkout', {
    title: product?.product_name || 'Checkout',
    product,
    qty,
    errorMessage
  });
});

module.exports = router;
