const express = require('express');
const router = express.Router();

const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

async function fetchSingleProduct(productId) {
  const baseUrl = process.env.BASE_URL || 'https://aerthh.newhopeindia17.com/api/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  console.log('[buy-route] fetching product api:', `${normalizedBaseUrl}products/${productId}`);
  const resp = await fetchFn(`${normalizedBaseUrl}products/${productId}`);
  const data = await resp.json();
  console.log('[buy-route] api response status:', resp.status);
  console.log('[buy-route] api response body:', JSON.stringify(data));

  if (!resp.ok || !data?.status) {
    throw new Error(data?.message || `HTTP ${resp.status}`);
  }

  return data.data || null;
}

async function fetchAllProducts() {
  const baseUrl = process.env.BASE_URL || 'https://aerthh.newhopeindia17.com/api/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const resp = await fetchFn(`${normalizedBaseUrl}products`);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data?.message || `HTTP ${resp.status}`);
  }

  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
}

function buildSimilarProducts(product, products) {
  if (!product || !Array.isArray(products)) return [];

  const currentId = String(product.id || '');
  const categoryId = String(product.category_id || '');
  const brandId = String(product.brand_id || '');

  const others = products.filter((item) => String(item?.id || '') !== currentId);
  const sameCategory = others.filter((item) => String(item?.category_id || '') === categoryId);
  const sameBrand = others.filter((item) => String(item?.brand_id || '') === brandId && !sameCategory.some((p) => String(p.id) === String(item.id)));
  const fallbackProducts = others.filter((item) =>
    !sameCategory.some((p) => String(p.id) === String(item.id)) &&
    !sameBrand.some((p) => String(p.id) === String(item.id))
  );

  return sameCategory.concat(sameBrand, fallbackProducts).slice(0, 4);
}

router.get('/', async (req, res) => {
  const selectedCategoryId = String(req.query.category || '').trim();
  const selectedCategoryName = String(req.query.category_name || '').trim();
  const selectedBrandId = String(req.query.brand || '').trim();
  const selectedBrandName = String(req.query.brand_name || '').trim();
  let products = [];
  let errorMessage = '';

  try {
    products = await fetchAllProducts();
    if (selectedCategoryId) {
      products = products.filter((item) => {
        const itemCategoryId = String(item?.category_id || item?.category?.id || '');
        return itemCategoryId === selectedCategoryId;
      });
    }
    if (selectedBrandId) {
      products = products.filter((item) => {
        const itemBrandId = String(item?.brand_id || item?.brand?.id || '');
        return itemBrandId === selectedBrandId;
      });
    }
  } catch (error) {
    errorMessage = error.message || 'Failed to fetch products.';
  }

  res.render('prodcuts/products', {
    title: selectedCategoryName || selectedBrandName || 'Products',
    products,
    selectedCategoryId,
    selectedCategoryName,
    selectedBrandId,
    selectedBrandName,
    errorMessage
  });
});

router.get('/buy', async (req, res) => {
  const rawProductId = req.query.id || req.params.id || req.query.product_id || '';
  const productId = String(rawProductId).trim();
  let product = null;
  let similarProducts = [];
  let errorMessage = '';
  console.log('[buy-route] /buy payload id:', productId);

  if (!productId) {
    errorMessage = 'Product id is required.';
  } else {
    try {
      product = await fetchSingleProduct(productId);
      try {
        const allProducts = await fetchAllProducts();
        similarProducts = buildSimilarProducts(product, allProducts);
        console.log('[buy-route] similar products count:', similarProducts.length);
      } catch (similarError) {
        console.error('Error fetching similar products:', similarError.message || similarError);
      }
      console.log('[buy-route] /buy fetched product:', JSON.stringify(product));
    } catch (error) {
      console.error('Error fetching product:', error.message || error);
      errorMessage = error.message || 'Failed to fetch product.';
    }
  }

  res.render('prodcuts/buy', {
    title: product?.product_name || 'Buy',
    product,
    similarProducts,
    errorMessage
  });
});

router.get('/:id', async (req, res) => {
  const productId = String(req.params.id || '').trim();
  let product = null;
  let similarProducts = [];
  let errorMessage = '';
  console.log('[buy-route] /:id payload id:', productId);

  if (!productId) {
    errorMessage = 'Product id is required.';
  } else {
    try {
      product = await fetchSingleProduct(productId);
      try {
        const allProducts = await fetchAllProducts();
        similarProducts = buildSimilarProducts(product, allProducts);
        console.log('[buy-route] similar products count:', similarProducts.length);
      } catch (similarError) {
        console.error('Error fetching similar products:', similarError.message || similarError);
      }
      console.log('[buy-route] /:id fetched product:', JSON.stringify(product));
    } catch (error) {
      console.error('Error fetching product:', error.message || error);
      errorMessage = error.message || 'Failed to fetch product.';
    }
  }

  res.render('prodcuts/buy', {
    title: product?.product_name || 'Buy',
    product,
    similarProducts,
    errorMessage
  });
});

module.exports = router;
