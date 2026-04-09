const express = require('express');
const router = express.Router();

const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

function normalizeApiBase(value) {
  const base = String(value || 'https://aerthh.newhopeindia17.com/api/').trim();
  return base.endsWith('/') ? base : base + '/';
}

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.vendors)) return payload.vendors;
  if (Array.isArray(payload.products)) return payload.products;
  return [];
}

function pickEntity(payload, requestedId) {
  const normalizedId = String(requestedId || '').trim();
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload.find((item) => String(item?.id || item?.vendor_id || item?._id || '') === normalizedId) || payload[0] || null;
  }

  if (typeof payload !== 'object') return null;

  if (payload.data) {
    return pickEntity(payload.data, requestedId);
  }

  if (
    payload.id ||
    payload.vendor_id ||
    payload._id ||
    payload.name ||
    payload.vendor_name ||
    payload.product_name
  ) {
    return payload;
  }

  return null;
}

async function fetchJson(url) {
  const response = await fetchFn(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function fetchVendorListPage(apiBase, page) {
  const payload = await fetchJson(`${apiBase}vendors?page=${page}`);
  return {
    payload,
    list: extractList(payload),
    currentPage: Number(payload?.current_page || page || 1),
    lastPage: Number(payload?.last_page || 1),
    total: Number(payload?.total || 0)
  };
}

async function fetchBestSellerMap(apiBase) {
  try {
    const payload = await fetchJson(`${apiBase}best-sellers`);
    const list = extractList(payload);
    const map = new Map();

    list.forEach((item) => {
      const id = String(item?.id || item?.vendor_id || '').trim();
      if (!id) return;
      map.set(id, item);
    });

    return map;
  } catch (error) {
    return new Map();
  }
}

function mergeVendorMetrics(vendor, metricSource) {
  if (!vendor) return vendor;
  const source = metricSource || {};
  return {
    ...vendor,
    total_sold:
      source.total_sold ??
      source.orders_sum_quantity ??
      vendor.total_sold ??
      vendor.orders_sum_quantity ??
      0,
    total_orders:
      source.total_orders ??
      source.orders_count ??
      vendor.total_orders ??
      vendor.orders_count ??
      0
  };
}

async function fetchVendorById(apiBase, vendorId) {
  const normalizedId = String(vendorId || '').trim();
  if (!normalizedId) return null;

  const directCandidates = [
    `${apiBase}vendors/${encodeURIComponent(normalizedId)}`,
    `${apiBase}vendors?id=${encodeURIComponent(normalizedId)}`
  ];

  for (const endpoint of directCandidates) {
    try {
      const payload = await fetchJson(endpoint);
      const entity = pickEntity(payload, normalizedId);
      if (entity && String(entity.id || entity.vendor_id || '') === normalizedId) {
        return entity;
      }
    } catch (error) {
      // Try the next candidate.
    }
  }

  try {
    const firstPage = await fetchVendorListPage(apiBase, 1);
    const totalPages = Math.max(Number(firstPage.lastPage || 1), 1);

    const match = firstPage.list.find((item) => String(item?.id || item?.vendor_id || '') === normalizedId);
    if (match) return match;

    for (let page = 2; page <= totalPages; page += 1) {
      try {
        const pageData = await fetchVendorListPage(apiBase, page);
        const found = pageData.list.find((item) => String(item?.id || item?.vendor_id || '') === normalizedId);
        if (found) return found;
      } catch (error) {
        // Keep scanning remaining pages.
      }
    }
  } catch (error) {
    // Ignore and fall through to null.
  }

  return null;
}

async function fetchAllProducts(apiBase) {
  const firstPayload = await fetchJson(`${apiBase}products`);
  const firstList = extractList(firstPayload);
  const lastPage = Number(firstPayload?.last_page || 1);
  if (!lastPage || lastPage <= 1) {
    return firstList;
  }

  const merged = [...firstList];
  for (let page = 2; page <= lastPage; page += 1) {
    try {
      const pagePayload = await fetchJson(`${apiBase}products?page=${page}`);
      merged.push(...extractList(pagePayload));
    } catch (error) {
      // Continue with what we already have.
    }
  }

  return merged;
}

function matchesVendorProduct(product, vendor) {
  if (!product || !vendor) return false;

  const vendorId = String(vendor.id || vendor.vendor_id || '').trim();

  const idCandidates = [
    product.vendor_id,
    product.vendorId,
    product.vendor?.id,
    product.vendor?.vendor_id,
    product.seller_id,
    product.user_id,
    product.owner_id,
    product.store_id
  ].map((value) => String(value || '').trim());

  if (vendorId && idCandidates.some((value) => value === vendorId)) {
    return true;
  }
  return false;
}

function filterStrictVendorProducts(products, vendor) {
  if (!Array.isArray(products) || !vendor) return [];
  const vendorId = String(vendor.id || vendor.vendor_id || '').trim();
  if (!vendorId) return [];

  return products.filter((product) => {
    const productVendorId = String(product?.vendor_id || product?.vendorId || product?.vendor?.id || product?.vendor?.vendor_id || '').trim();
    return productVendorId === vendorId;
  });
}

async function fetchVendorProducts(apiBase, vendor) {
  const vendorId = String(vendor?.id || vendor?.vendor_id || '').trim();
  const queryCandidates = vendorId
    ? [
        `${apiBase}vendors/${encodeURIComponent(vendorId)}/products`,
        `${apiBase}products?vendor_id=${encodeURIComponent(vendorId)}`,
        `${apiBase}products?vendor=${encodeURIComponent(vendorId)}`,
        `${apiBase}products?seller_id=${encodeURIComponent(vendorId)}`
      ]
    : [];

  for (const endpoint of queryCandidates) {
    try {
      const payload = await fetchJson(endpoint);
      const list = extractList(payload);
      if (list.length) {
        return list;
      }
    } catch (error) {
      // Try the next endpoint.
    }
  }

  try {
    const allProducts = await fetchAllProducts(apiBase);
    return allProducts.filter((product) => matchesVendorProduct(product, vendor));
  } catch (error) {
    return [];
  }
}

router.get('/', async (req, res) => {
  const apiBase = normalizeApiBase(process.env.BASE_URL);
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const endpoint = `${apiBase}vendors?page=${page}`;

  try {
    const payload = await fetchJson(endpoint);
    const vendorList = extractList(payload);
    const bestSellerMap = await fetchBestSellerMap(apiBase);
    const enrichedVendors = vendorList.map((vendor) => mergeVendorMetrics(vendor, bestSellerMap.get(String(vendor?.id || vendor?.vendor_id || '').trim())));

    res.render('auth/vendor/vendors', {
      title: 'Vendors',
      apiBase,
      vendorsPage: payload || {},
      vendors: enrichedVendors,
      selectedVendor: null,
      vendorProducts: [],
      currentPage: Number(payload?.current_page || page),
      lastPage: Number(payload?.last_page || 1),
      total: Number(payload?.total || enrichedVendors.length || 0),
      errorMessage: ''
    });
  } catch (error) {
    console.error('Failed to load vendors:', error.message || error);
    res.render('auth/vendor/vendors', {
      title: 'Vendors',
      apiBase,
      vendorsPage: {},
      vendors: [],
      selectedVendor: null,
      vendorProducts: [],
      currentPage: page,
      lastPage: 1,
      total: 0,
      errorMessage: 'Unable to load vendors right now.'
    });
  }
});

router.get('/:id', async (req, res) => {
  const apiBase = normalizeApiBase(process.env.BASE_URL);
  const vendorId = String(req.params.id || '').trim();

  if (!vendorId) {
    res.redirect('/vendors');
    return;
  }

  try {
    const selectedVendor = await fetchVendorById(apiBase, vendorId);
    if (!selectedVendor) {
      res.status(404).render('auth/vendor/vendors', {
        title: 'Vendor not found',
        apiBase,
        vendorsPage: {},
        vendors: [],
        selectedVendor: null,
        vendorProducts: [],
        currentPage: 1,
        lastPage: 1,
        total: 0,
        errorMessage: 'Vendor not found.'
      });
      return;
    }

    const bestSellerMap = await fetchBestSellerMap(apiBase);
    const enrichedVendor = mergeVendorMetrics(selectedVendor, bestSellerMap.get(String(selectedVendor.id || selectedVendor.vendor_id || '').trim()));
    const vendorProducts = await fetchVendorProducts(apiBase, selectedVendor);
    const strictVendorProducts = filterStrictVendorProducts(vendorProducts, selectedVendor);

    res.render('auth/vendor/vendors', {
      title: enrichedVendor.name || 'Vendor',
      apiBase,
      vendorsPage: {},
      vendors: [],
      selectedVendor: enrichedVendor,
      vendorProducts: strictVendorProducts,
      currentPage: 1,
      lastPage: 1,
      total: strictVendorProducts.length,
      errorMessage: ''
    });
  } catch (error) {
    console.error('Failed to load vendor detail:', error.message || error);
    res.status(500).render('auth/vendor/vendors', {
      title: 'Vendor',
      apiBase,
      vendorsPage: {},
      vendors: [],
      selectedVendor: null,
      vendorProducts: [],
      currentPage: 1,
      lastPage: 1,
      total: 0,
      errorMessage: 'Unable to load vendor details right now.'
    });
  }
});

module.exports = router;
