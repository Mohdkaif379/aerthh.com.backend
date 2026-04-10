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
  console.log('[buy-route] fetching product api:', `${normalizedBaseUrl}products/${productId}`);
  const resp = await fetchFn(`${normalizedBaseUrl}products/${productId}`);
  const data = await resp.json();
  console.log('[buy-route] api response status:', resp.status);
  console.log('[buy-route] api response body:', JSON.stringify(data));

  if (!resp.ok) {
    throw new Error(data?.message || `HTTP ${resp.status}`);
  }

  if (data?.status === false) {
    throw new Error(data?.message || 'Failed to fetch product.');
  }

  const product = normalizeProductEntity(data, productId);
  if (product) {
    return product;
  }

  throw new Error('Product data was not found in API response.');
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

async function fetchVendorById(vendorId) {
  const normalizedVendorId = String(vendorId || '').trim();
  if (!normalizedVendorId) return null;

  const baseUrl = process.env.BASE_URL || 'https://aerthh.newhopeindia17.com/api/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const endpoints = [
    `${normalizedBaseUrl}vendors/${encodeURIComponent(normalizedVendorId)}`,
    `${normalizedBaseUrl}vendors?id=${encodeURIComponent(normalizedVendorId)}`
  ];

  for (const endpoint of endpoints) {
    try {
      const resp = await fetchFn(endpoint);
      const data = await resp.json().catch(() => null);
      if (!resp.ok) continue;
      const candidate = normalizeProductEntity(data, normalizedVendorId);
      if (candidate && String(candidate.id || candidate.vendor_id || '') === normalizedVendorId) {
        return candidate;
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  try {
    const resp = await fetchFn(`${normalizedBaseUrl}vendors`);
    const data = await resp.json().catch(() => null);
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.find((vendor) => String(vendor?.id || vendor?.vendor_id || '') === normalizedVendorId) || null;
  } catch (error) {
    return null;
  }
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

  res.render('products/products', {
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
  const rawProductId = req.query.id || req.query.product_id || req.params.id || req.query.slug || '';
  const productId = String(rawProductId).trim();
  let product = null;
  let vendor = null;
  let similarProducts = [];
  let errorMessage = '';
  console.log('[buy-route] /buy payload id:', productId);

  if (!productId) {
    errorMessage = 'Product id is required.';
  } else {
    try {
      product = await fetchSingleProduct(productId);
      const vendorId = String(product?.vendor_id || product?.vendor?.id || product?.vendor?.vendor_id || '').trim();
      if (product?.vendor && typeof product.vendor === 'object') {
        vendor = product.vendor;
      } else if (vendorId) {
        vendor = await fetchVendorById(vendorId);
      }
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

  res.render('products/buy', {
    title: product?.product_name || 'Buy',
    product,
    vendor,
    selectedProductId: productId,
    similarProducts,
    errorMessage
  });
});

router.get('/address', async (req, res) => {
  const isCartMode = String(req.query.cart || '').trim() === '1';
  if (isCartMode) {
    res.render('products/address', {
      title: 'Cart Address',
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
      console.error('Error fetching product for address page:', error.message || error);
      errorMessage = error.message || 'Failed to fetch product.';
    }
  }

  res.render('products/address', {
    title: product?.product_name || 'Address',
    product,
    selectedProductId: productId,
    qty,
    errorMessage
  });
});

router.get('/:id', async (req, res) => {
  const productId = String(req.params.id || '').trim();
  let product = null;
  let vendor = null;
  let similarProducts = [];
  let errorMessage = '';
  console.log('[buy-route] /:id payload id:', productId);

  if (!productId) {
    errorMessage = 'Product id is required.';
  } else {
    try {
      product = await fetchSingleProduct(productId);
      const vendorId = String(product?.vendor_id || product?.vendor?.id || product?.vendor?.vendor_id || '').trim();
      if (product?.vendor && typeof product.vendor === 'object') {
        vendor = product.vendor;
      } else if (vendorId) {
        vendor = await fetchVendorById(vendorId);
      }
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

  res.render('products/buy', {
    title: product?.product_name || 'Buy',
    product,
    vendor,
    selectedProductId: productId,
    similarProducts,
    errorMessage
  });
});

module.exports = router;
