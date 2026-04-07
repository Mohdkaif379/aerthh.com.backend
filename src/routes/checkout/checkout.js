const express = require('express');

const router = express.Router();
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

function normalizeProductEntity(payload, requestedProductId = '') {
  const normalizedRequestedId = String(requestedProductId || '').trim();

  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload.find((item) => String(item?.id || item?.product_id || item?._id || item?.slug || '') === normalizedRequestedId) || payload[0] || null;
  }

  if (typeof payload !== 'object') return null;

  if (payload.data) {
    return normalizeProductEntity(payload.data, requestedProductId);
  }

  if (payload.product) {
    return normalizeProductEntity(payload.product, requestedProductId);
  }

  if (payload.id || payload.product_id || payload._id || payload.slug || payload.product_name || payload.name) {
    return payload;
  }

  return null;
}

async function fetchSingleProduct(productId) {
  const baseUrl = process.env.BASE_URL || 'https://aerthh.newhopeindia17.com/api/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const response = await fetchFn(`${normalizedBaseUrl}products/${productId}`);
  const data = await response.json();

  if (!response.ok || !data?.status) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  const product = normalizeProductEntity(data, productId);
  if (product) {
    return product;
  }

  throw new Error('Product data was not found in API response.');
}

router.get('/', async (req, res) => {
  const isCartMode = String(req.query.cart || '').trim() === '1';
  if (isCartMode) {
    res.render('checkout/checkout', {
      title: 'Cart Checkout',
      product: null,
      selectedProductId: '',
      qty: 1,
      errorMessage: '',
      cartMode: true
    });
    return;
  }

  const productId = String(req.query.id || req.query.product_id || req.query.slug || '').trim();
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
    selectedProductId: productId,
    qty,
    errorMessage
  });
});

module.exports = router;
