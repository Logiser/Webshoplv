// Storage Helper - Supabase háttérrel (localStorage fallback)
// Termékek, FIFO, akciók, statisztikák + wishlist, blog, beszállító értesítések, rendelés workflow
//
// Két üzemmód:
//  - Supabase mód (REACT_APP_SUPABASE_URL beállítva): a szinkron olvasások memória-
//    cache-ből mennek, amit az app indulásakor az initStorage() tölt fel. Az admin
//    írások az admin-api function-ön, a rendelés a place-order function-ön keresztül
//    kerülnek az adatbázisba. A wishlist és a nézettség böngésző-lokális marad.
//  - localStorage mód (nincs Supabase env): minden pontosan úgy működik, mint eddig.

import { products as baseProducts } from './productData';
import { supabase, isSupabaseEnabled, adminApi, getAdminPassword } from './supabaseClient';

const STORAGE_KEYS = {
  OVERRIDES: 'ms_product_overrides',
  CUSTOM: 'ms_custom_products',
  STOCK_HISTORY: 'ms_stock_history',
  ORDERS: 'ms_orders',
  WISHLIST: 'ms_wishlist',
  BLOG_POSTS: 'ms_blog_posts',
  SUPPLIER_NOTIF: 'ms_supplier_notifications',
  VIEW_ACTIVITY: 'ms_view_activity',  // élő készlet/aktivitás
  COUPONS: 'ms_coupons',
  HOMEPAGE_CONTENT: 'ms_homepage_content'  // kódolás nélkül szerkeszthető főoldal-szövegek
};

// Supabase módban is böngésző-lokális kulcsok (személyes / kozmetikai adatok)
const LOCAL_ONLY_KEYS = [STORAGE_KEYS.WISHLIST, STORAGE_KEYS.VIEW_ACTIVITY];
// Anon kulccsal is olvasható (publikus) kulcsok
const PUBLIC_KEYS = [STORAGE_KEYS.OVERRIDES, STORAGE_KEYS.CUSTOM, STORAGE_KEYS.BLOG_POSTS, STORAGE_KEYS.HOMEPAGE_CONTENT];

// ======================== ALAP HELPERS ========================

const memCache = {};

const localGet = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Read error ${key}:`, e);
    return defaultValue;
  }
};

const localSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Save error ${key}:`, e);
    return false;
  }
};

const safeGet = (key, defaultValue = null) => {
  if (isSupabaseEnabled && !LOCAL_ONLY_KEYS.includes(key)) {
    return memCache[key] !== undefined ? memCache[key] : defaultValue;
  }
  return localGet(key, defaultValue);
};

const safeSet = (key, value) => {
  if (isSupabaseEnabled && !LOCAL_ONLY_KEYS.includes(key)) {
    memCache[key] = value;
    // A rendeléseket a place-order / update_order kezeli, KV-ba nem kerülnek
    if (key !== STORAGE_KEYS.ORDERS) {
      adminApi('set_kv', { key, value }).catch(e =>
        console.error(`Supabase mentési hiba (${key}):`, e.message)
      );
    }
    return true;
  }
  return localSet(key, value);
};

// App-indításkor hívandó: feltölti a memória-cache-t Supabase-ből.
// Publikus kulcsok anon kulccsal; admin bejelentkezés után minden (+ rendelések).
export const initStorage = async () => {
  if (!isSupabaseEnabled) return;
  try {
    if (getAdminPassword()) {
      const { kv, orders } = await adminApi('get_all');
      Object.entries(kv || {}).forEach(([k, v]) => { memCache[k] = v; });
      memCache[STORAGE_KEYS.ORDERS] = orders || [];
    } else {
      const { data, error } = await supabase
        .from('kv_store')
        .select('key, value')
        .in('key', PUBLIC_KEYS);
      if (error) throw error;
      (data || []).forEach(r => { memCache[r.key] = r.value; });
    }
  } catch (e) {
    console.error('Supabase betöltési hiba (üres cache-sel indulunk):', e.message);
  }
};

// Slug generálás (SEO URL-hez)
export const slugify = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
    .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// ======================== TERMÉKEK ========================

export const getAllProducts = () => {
  const overrides = safeGet(STORAGE_KEYS.OVERRIDES, {});
  const customProducts = safeGet(STORAGE_KEYS.CUSTOM, []);

  const merged = baseProducts.map(p => {
    const override = overrides[p.id];
    const merged_p = override ? { ...p, ...override } : { ...p };
    // Variáns-készletek rávetítése (rendelésekkor csökken, override-ban tárolódik)
    if (Array.isArray(merged_p.variants) && override && override.variantStock) {
      merged_p.variants = merged_p.variants.map(v =>
        override.variantStock[v.code] !== undefined ? { ...v, stock: override.variantStock[v.code] } : v
      );
    }
    // Méret-szintű készletek rávetítése (szín×méret mátrix)
    if (Array.isArray(merged_p.variants) && override && override.variantSizeStock) {
      merged_p.variants = merged_p.variants.map(v => {
        const vss = override.variantSizeStock[v.code];
        if (v.sizeStock && vss) {
          const sizeStock = { ...v.sizeStock, ...vss };
          const total = Object.values(sizeStock).reduce((s, n) => s + (parseInt(n) || 0), 0);
          return { ...v, sizeStock, stock: total };
        }
        return v;
      });
    }
    // Slug generálás (ha nincs)
    if (!merged_p.slug) merged_p.slug = slugify(merged_p.name);
    return merged_p;
  });

  const customsWithSlug = customProducts.map(p => ({
    ...p,
    slug: p.slug || slugify(p.name)
  }));

  return [...merged, ...customsWithSlug];
};

export const getVisibleProducts = () => {
  return getAllProducts().filter(p => !p.hidden);
};

export const getProductBySlug = (slug) => {
  return getAllProducts().find(p => p.slug === slug);
};

export const updateProduct = (id, updates) => {
  const customProducts = safeGet(STORAGE_KEYS.CUSTOM, []);
  const isCustom = customProducts.some(p => p.id === id);

  if (isCustom) {
    const updated = customProducts.map(p => p.id === id ? { ...p, ...updates } : p);
    safeSet(STORAGE_KEYS.CUSTOM, updated);
  } else {
    const overrides = safeGet(STORAGE_KEYS.OVERRIDES, {});
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    safeSet(STORAGE_KEYS.OVERRIDES, overrides);
  }
  return true;
};

// Bulk update több termékre
export const bulkUpdateProducts = (ids, updates) => {
  ids.forEach(id => updateProduct(id, updates));
  return ids.length;
};

export const addCustomProduct = (product) => {
  const customProducts = safeGet(STORAGE_KEYS.CUSTOM, []);
  const allProducts = getAllProducts();
  const maxId = Math.max(...allProducts.map(p => p.id), 1000);
  const newProduct = {
    ...product,
    id: maxId + 1,
    slug: product.slug || slugify(product.name),
    isCustom: true,
    createdAt: new Date().toISOString()
  };
  customProducts.push(newProduct);
  safeSet(STORAGE_KEYS.CUSTOM, customProducts);
  return newProduct;
};

export const addCustomProductsBatch = (productsArray) => {
  const customProducts = safeGet(STORAGE_KEYS.CUSTOM, []);
  const allProducts = getAllProducts();
  let nextId = Math.max(...allProducts.map(p => p.id), 1000) + 1;
  
  const newProducts = productsArray.map(p => {
    const newP = {
      ...p,
      id: nextId++,
      slug: slugify(p.name),
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    customProducts.push(newP);
    return newP;
  });
  
  safeSet(STORAGE_KEYS.CUSTOM, customProducts);
  return newProducts;
};

export const deleteCustomProduct = (id) => {
  const customProducts = safeGet(STORAGE_KEYS.CUSTOM, []);
  const filtered = customProducts.filter(p => p.id !== id);
  safeSet(STORAGE_KEYS.CUSTOM, filtered);
  return true;
};

export const resetProductOverride = (id) => {
  const overrides = safeGet(STORAGE_KEYS.OVERRIDES, {});
  delete overrides[id];
  safeSet(STORAGE_KEYS.OVERRIDES, overrides);
  return true;
};

// Egyedi márkák kinyerése
export const getAllBrands = () => {
  const products = getVisibleProducts();
  const brands = new Set();
  products.forEach(p => {
    if (p.brand) brands.add(p.brand);
  });
  return Array.from(brands).sort();
};

// ======================== AKCIÓK ========================

export const setProductSale = (id, salePrice, label = '', endDate = null) => {
  return updateProduct(id, {
    sale: { active: true, price: salePrice, label, endDate }
  });
};

export const removeProductSale = (id) => {
  return updateProduct(id, { sale: null });
};

export const cleanExpiredSales = () => {
  const overrides = safeGet(STORAGE_KEYS.OVERRIDES, {});
  const today = new Date().toISOString().split('T')[0];
  let cleaned = 0;
  
  Object.keys(overrides).forEach(id => {
    const o = overrides[id];
    if (o.sale && o.sale.endDate && o.sale.endDate < today) {
      delete o.sale;
      cleaned++;
    }
  });
  
  safeSet(STORAGE_KEYS.OVERRIDES, overrides);
  return cleaned;
};

// ======================== KÉSZLET / FIFO ========================

export const addStockBatch = (productId, quantity, unitCost = 0, batchNumber = '') => {
  const history = safeGet(STORAGE_KEYS.STOCK_HISTORY, []);
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return false;

  const newEntry = {
    id: Date.now() + Math.random(),
    productId,
    productName: product.name,
    type: 'IN',
    quantity: parseInt(quantity),
    remaining: parseInt(quantity),
    unitCost: parseFloat(unitCost) || 0,
    batchNumber: batchNumber || `B-${Date.now()}`,
    date: new Date().toISOString()
  };

  history.push(newEntry);
  safeSet(STORAGE_KEYS.STOCK_HISTORY, history);

  updateProduct(productId, { stock: (product.stock || 0) + parseInt(quantity) });

  // Beszállító értesítés - ha volt, töröljük
  removeSupplierNotification(productId);

  return newEntry;
};

export const removeStockFIFO = (productId, quantity, reason = 'Rendelés', colorCode = null, size = null) => {
  const history = safeGet(STORAGE_KEYS.STOCK_HISTORY, []);
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return false;

  let toRemove = parseInt(quantity);
  let totalCost = 0;

  const inEntries = history
    .filter(h => h.productId === productId && h.type === 'IN' && h.remaining > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const entry of inEntries) {
    if (toRemove <= 0) break;
    const takeFrom = Math.min(entry.remaining, toRemove);
    entry.remaining -= takeFrom;
    toRemove -= takeFrom;
    totalCost += takeFrom * entry.unitCost;
  }

  const outEntry = {
    id: Date.now() + Math.random(),
    productId,
    productName: product.name,
    type: 'OUT',
    quantity: parseInt(quantity),
    reason,
    totalCost,
    date: new Date().toISOString()
  };
  history.push(outEntry);
  safeSet(STORAGE_KEYS.STOCK_HISTORY, history);

  const newStock = Math.max(0, (product.stock || 0) - parseInt(quantity));
  const updates = { stock: newStock };

  // Variáns (szín) készlet csökkentése is
  if (colorCode && Array.isArray(product.variants)) {
    const variant = product.variants.find(v => v.code === colorCode);
    if (variant) {
      const overrides = safeGet(STORAGE_KEYS.OVERRIDES, {});
      const prevVS = (overrides[productId] && overrides[productId].variantStock) || {};
      updates.variantStock = {
        ...prevVS,
        [colorCode]: Math.max(0, (variant.stock || 0) - parseInt(quantity))
      };
      // Méret-szintű készlet csökkentése (ha a variáns mátrixot használ)
      if (size && variant.sizeStock && variant.sizeStock[size] !== undefined) {
        const prevVSS = (overrides[productId] && overrides[productId].variantSizeStock) || {};
        updates.variantSizeStock = {
          ...prevVSS,
          [colorCode]: {
            ...(prevVSS[colorCode] || {}),
            [size]: Math.max(0, (variant.sizeStock[size] || 0) - parseInt(quantity))
          }
        };
      }
    }
  }
  updateProduct(productId, updates);

  // Automatikus beszállító értesítés alacsony készletnél
  if (newStock < 10) {
    addSupplierNotification(productId, newStock);
  }

  return outEntry;
};

export const getStockHistory = (productId = null) => {
  const history = safeGet(STORAGE_KEYS.STOCK_HISTORY, []);
  if (productId) return history.filter(h => h.productId === productId);
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getProductFIFOBatches = (productId) => {
  const history = safeGet(STORAGE_KEYS.STOCK_HISTORY, []);
  return history
    .filter(h => h.productId === productId && h.type === 'IN' && h.remaining > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

// ======================== BESZÁLLÍTÓ ÉRTESÍTÉSEK ========================

export const addSupplierNotification = (productId, currentStock) => {
  const notifs = safeGet(STORAGE_KEYS.SUPPLIER_NOTIF, []);
  if (notifs.some(n => n.productId === productId && !n.resolved)) return;
  
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return;

  notifs.push({
    id: Date.now() + Math.random(),
    productId,
    productName: product.name,
    currentStock,
    suggestedOrder: Math.max(50, Math.floor(currentStock * 5)),
    date: new Date().toISOString(),
    resolved: false
  });
  safeSet(STORAGE_KEYS.SUPPLIER_NOTIF, notifs);
};

export const removeSupplierNotification = (productId) => {
  const notifs = safeGet(STORAGE_KEYS.SUPPLIER_NOTIF, []);
  const updated = notifs.map(n => n.productId === productId ? { ...n, resolved: true } : n);
  safeSet(STORAGE_KEYS.SUPPLIER_NOTIF, updated);
};

export const getSupplierNotifications = () => {
  return safeGet(STORAGE_KEYS.SUPPLIER_NOTIF, []).filter(n => !n.resolved);
};

// ======================== STATISZTIKÁK + RIPORTOK ========================

export const getStatistics = () => {
  const allProducts = getAllProducts();
  const visible = allProducts.filter(p => !p.hidden);
  const hidden = allProducts.filter(p => p.hidden);
  const onSale = allProducts.filter(p => p.sale && p.sale.active);
  const lowStock = allProducts.filter(p => p.stock > 0 && p.stock < 20 && !p.hidden);
  const outOfStock = allProducts.filter(p => p.stock === 0 && !p.hidden);
  const customCount = allProducts.filter(p => p.isCustom).length;
  const totalStockValue = allProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  const byCategory = {};
  visible.forEach(p => {
    if (!byCategory[p.categoryId]) byCategory[p.categoryId] = { count: 0, value: 0, totalStock: 0 };
    byCategory[p.categoryId].count++;
    byCategory[p.categoryId].value += p.price * (p.stock || 0);
    byCategory[p.categoryId].totalStock += p.stock || 0;
  });

  const sortedByPrice = [...visible].sort((a, b) => b.price - a.price);
  const top5Expensive = sortedByPrice.slice(0, 5);
  const top5Cheap = [...visible].sort((a, b) => a.price - b.price).slice(0, 5);

  const orders = safeGet(STORAGE_KEYS.ORDERS, []);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalProducts: allProducts.length,
    visibleProducts: visible.length,
    hiddenProducts: hidden.length,
    onSaleCount: onSale.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    customProductCount: customCount,
    totalStockValue,
    byCategory,
    top5Expensive,
    top5Cheap,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    totalOrders: orders.length,
    totalRevenue,
    supplierNotifCount: getSupplierNotifications().length
  };
};

// Részletes értékesítési riportok
export const getSalesReport = (period = 'week') => {
  const orders = safeGet(STORAGE_KEYS.ORDERS, []);
  const now = new Date();
  let daysBack = 7;
  if (period === 'month') daysBack = 30;
  if (period === 'quarter') daysBack = 90;
  if (period === 'year') daysBack = 365;

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const periodOrders = orders.filter(o => new Date(o.date) >= cutoff);

  // Napi/heti/havi bontás
  const byDay = {};
  periodOrders.forEach(o => {
    const day = new Date(o.date).toISOString().split('T')[0];
    if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
    byDay[day].count++;
    byDay[day].revenue += o.total || 0;
  });

  // Top eladott termékek (rendelt mennyiség alapján)
  const productSales = {};
  periodOrders.forEach(o => {
    (o.cart || o.items || []).forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[item.id].quantity += item.quantity || 0;
      productSales[item.id].revenue += (item.price * item.quantity) || 0;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Kategória teljesítmény
  const allProducts = getAllProducts();
  const categoryPerf = {};
  periodOrders.forEach(o => {
    (o.cart || o.items || []).forEach(item => {
      const p = allProducts.find(prod => prod.id === item.id);
      if (p) {
        if (!categoryPerf[p.categoryId]) categoryPerf[p.categoryId] = { quantity: 0, revenue: 0 };
        categoryPerf[p.categoryId].quantity += item.quantity || 0;
        categoryPerf[p.categoryId].revenue += (item.price * item.quantity) || 0;
      }
    });
  });

  // Visszatérő vásárlók (email alapján)
  const customerOrders = {};
  orders.forEach(o => {
    const email = o.customer?.email || o.email;
    if (email) {
      if (!customerOrders[email]) customerOrders[email] = 0;
      customerOrders[email]++;
    }
  });
  const totalCustomers = Object.keys(customerOrders).length;
  const returningCustomers = Object.values(customerOrders).filter(c => c > 1).length;
  const returningPct = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;

  return {
    period,
    periodOrders: periodOrders.length,
    periodRevenue: periodOrders.reduce((s, o) => s + (o.total || 0), 0),
    byDay,
    topProducts,
    categoryPerf,
    totalCustomers,
    returningCustomers,
    returningPct,
    avgOrderValue: periodOrders.length > 0 ? Math.round(periodOrders.reduce((s, o) => s + (o.total || 0), 0) / periodOrders.length) : 0
  };
};

// ======================== RENDELÉSEK (kibővített workflow-val) ========================

export const ORDER_STATUSES = [
  { id: 'pending', name: 'Új', color: '#FF9800', icon: '⏳' },
  { id: 'paid', name: 'Fizetve', color: '#2196F3', icon: '💳' },
  { id: 'packed', name: 'Csomagolva', color: '#9C27B0', icon: '📦' },
  { id: 'shipped', name: 'Feladva', color: '#00897B', icon: '🚚' },
  { id: 'delivered', name: 'Kézbesítve', color: '#4CAF50', icon: '✅' },
  { id: 'cancelled', name: 'Lemondva', color: '#d32f2f', icon: '❌' }
];

export const saveOrder = async (order) => {
  // Supabase mód: a teljes rendelés-mentés (FIFO + számlaszám) szerver-oldalon fut
  if (isSupabaseEnabled) {
    const res = await fetch('/.netlify/functions/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Rendelés mentési hiba');
    }
    const { order: newOrder } = await res.json();
    // Friss készletadatok visszatöltése (a szerver módosította az override-okat)
    initStorage().catch(() => {});
    return newOrder;
  }

  // localStorage mód: minden a böngészőben történik (eredeti viselkedés)
  const orders = safeGet(STORAGE_KEYS.ORDERS, []);
  const orderId = 'ORD-' + Date.now();
  const newOrder = {
    ...order,
    id: orderId,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(orders.length + 1).padStart(5, '0')}`,
    date: new Date().toISOString(),
    status: 'pending',
    statusHistory: [{ status: 'pending', date: new Date().toISOString(), note: 'Rendelés rögzítve' }],
    trackingNumber: null
  };
  orders.push(newOrder);
  safeSet(STORAGE_KEYS.ORDERS, orders);

  if (order.cart && Array.isArray(order.cart)) {
    order.cart.forEach(item => {
      removeStockFIFO(item.id, item.quantity, `Rendelés: ${orderId}`, item.colorCode || null, item.size || null);
    });
  }

  return newOrder;
};

export const updateOrderStatus = (orderId, newStatus, note = '', trackingNumber = null) => {
  const orders = safeGet(STORAGE_KEYS.ORDERS, []);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return false;

  orders[idx].status = newStatus;
  if (!orders[idx].statusHistory) orders[idx].statusHistory = [];
  orders[idx].statusHistory.push({
    status: newStatus,
    date: new Date().toISOString(),
    note: note || ''
  });
  if (trackingNumber) orders[idx].trackingNumber = trackingNumber;

  if (isSupabaseEnabled) {
    // Optimista cache-frissítés + aszinkron mentés soronként
    memCache[STORAGE_KEYS.ORDERS] = orders;
    adminApi('update_order', { id: orderId, data: orders[idx] }).catch(e =>
      console.error('Rendelés státusz mentési hiba:', e.message)
    );
  } else {
    safeSet(STORAGE_KEYS.ORDERS, orders);
  }
  return orders[idx];
};

export const getOrders = () => {
  return safeGet(STORAGE_KEYS.ORDERS, []).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getOrderById = (id) => {
  return safeGet(STORAGE_KEYS.ORDERS, []).find(o => o.id === id);
};

// ======================== WISHLIST (KEDVENCEK) ========================

export const getWishlist = () => {
  return safeGet(STORAGE_KEYS.WISHLIST, []);
};

export const toggleWishlist = (productId) => {
  const wishlist = getWishlist();
  const idx = wishlist.indexOf(productId);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(productId);
  }
  safeSet(STORAGE_KEYS.WISHLIST, wishlist);
  return wishlist;
};

export const isInWishlist = (productId) => {
  return getWishlist().includes(productId);
};

// Kedvencek felülírása (email-alapú betöltéskor)
export const setWishlist = (ids) => {
  safeSet(STORAGE_KEYS.WISHLIST, Array.isArray(ids) ? ids : []);
  return getWishlist();
};

// Email-alapú mentés/betöltés a wishlist-api function-ön keresztül (csak Supabase módban)
// A felhőbe mentett kedvenclistát PIN védi — e-mail-cím önmagában nem elég
// a betöltéshez (különben bárki megnézhetné más listáját).
export const saveWishlistToCloud = async (email, pin) => {
  const res = await fetch('/.netlify/functions/wishlist-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'save', email, pin, items: getWishlist() })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Mentési hiba');
  return data;
};

export const loadWishlistFromCloud = async (email, pin) => {
  const res = await fetch('/.netlify/functions/wishlist-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'load', email, pin })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Betöltési hiba');
  setWishlist(data.items || []);
  return data.items || [];
};

// ======================== BLOG ========================

const defaultBlogPosts = [
  {
    id: 1,
    slug: 'hogyan-valassz-munkacipot',
    title: 'Hogyan válassz munkacipőt? S1, S2, S3 magyarázat',
    excerpt: 'A munkavédelmi cipő kategóriái és a választás szempontjai részletesen.',
    content: `<h2>Mi a különbség az S1, S2, S3 között?</h2>
<p>A munkavédelmi cipők EN ISO 20345 szabvány szerinti kategóriái:</p>
<ul>
<li><strong>S1:</strong> Acél vagy kompozit orrlemez (200J ütésállóság), antisztatikus, energiaelnyelő sarok. Belső térben ideális.</li>
<li><strong>S1P:</strong> Mint S1, plusz átszúrásgátló talpbetét. Műhelyekhez, építkezésekhez.</li>
<li><strong>S2:</strong> Mint S1, plusz vízálló bőr felsőrész. Külső munkavégzéshez.</li>
<li><strong>S3:</strong> Mint S2, plusz átszúrásgátló talpbetét és profilos talp. A legkomplexebb védelem.</li>
</ul>
<h2>Mit nézz a vásárláskor?</h2>
<p>A megfelelő munkacipő kiválasztásánál figyelj a méretre, illeszkedésre, anyagra (bőr lélegzőbb, mint a műanyag), és a talp típusára (csúszásgátló, SRC jelölésű).</p>
<h2>Tippek a viseléshez</h2>
<p>Az új cipő bejáratása minimum 1 hét. Mindennapi viseléshez vegyél 2 párat, és váltogasd! Tisztítsd rendszeresen, kezeld bőrápolóval.</p>`,
    author: 'TridentShop',
    date: '2024-11-15',
    image: '/images/products/ft15_bg.jpg',
    tags: ['munkacipo', 'utmutato', 'tanacsok']
  },
  {
    id: 2,
    slug: 'munkavedelmi-kesztyu-kategoriak',
    title: 'Munkavédelmi kesztyű kategóriák: melyiket válaszd?',
    excerpt: 'Vágásellenes, vegyi védelem, hideg ellen - megnézzük, melyik mire való.',
    content: `<h2>EN 388 - Mechanikai védelem</h2>
<p>A leggyakrabban használt szabvány. A 4 jegyű kód jelentése:</p>
<ul>
<li>1. szám: Súrlódás (0-4)</li>
<li>2. szám: Vágás (0-5)</li>
<li>3. szám: Tépés (0-4)</li>
<li>4. szám: Átszúrás (0-4)</li>
</ul>
<h2>Vágásellenes (Cut A-F)</h2>
<p>2016-tól új jelölés: Cut A (legalacsonyabb) - Cut F (legmagasabb). Üvegipar, lemezmunka, hentes munka esetén Cut C vagy fölött ajánlott.</p>
<h2>Vegyi védelem (EN ISO 374)</h2>
<p>Specifikus anyagok (savak, lúgok, oldószerek) ellen védő kesztyűk. A piktogramok jelzik, mire jó.</p>
<h2>Hideg ellen (EN 511)</h2>
<p>Konvektív hideg + kontakthideg + vízhatlanság jelölése. Téli kültéri munkához.</p>`,
    author: 'TridentShop',
    date: '2024-11-22',
    image: '/images/products/a120_bk.jpg',
    tags: ['kesztyu', 'szabvany', 'utmutato']
  },
  {
    id: 3,
    slug: 'jol-lathatosagi-ruha-szabvany',
    title: 'Hi-vis ruházat: mikor kötelező, és mit jelentenek az osztályok?',
    excerpt: 'EN ISO 20471 érthetően: 1-2-3. osztály, fluoreszcens és retroreflektív felületek, mosási élettartam, tipikus munkakörök.',
    content: `<h2>Mi számít jól láthatósági (hi-vis) ruhának?</h2>
<p>Az <strong>EN ISO 20471</strong> szabvány szerinti ruházat két elemből áll: <strong>fluoreszcens háttéranyagból</strong> (sárga, narancs vagy piros — nappal ez „világít”) és <strong>retroreflektív csíkokból</strong> (éjjel a fényszóró fényét veri vissza). A kettő EGYÜTT ad védelmet: a fluoreszcens szín nappali és szürkületi, a reflexcsík éjszakai láthatóságot biztosít.</p>
<h2>A három osztály — melyik mikor kell?</h2>
<ul>
<li><strong>1. osztály:</strong> a legkisebb előírt fluoreszcens és reflex felület. Csak alacsony kockázatú helyre: zárt telephely, parkoló, ahol a járműforgalom lassú.</li>
<li><strong>2. osztály:</strong> közepes felület — tipikusan mellény vagy póló. Raktári targoncaforgalom, telephelyi rakodás, alacsonyabb sebességű (max. kb. 50 km/h) forgalom közelében.</li>
<li><strong>3. osztály:</strong> a legnagyobb felület, és a szabvány szerint a törzset ÉS a végtagokat is fednie kell (hosszú ujjú kabát vagy kabát+nadrág együtt). Közút, autópálya, vasút, repülőtér — ahol gyors forgalom mellett dolgozol.</li>
</ul>
<p>Fontos: az osztály a TELJES viselt szettre értendő. Egy 2. osztályú kabát + 1. osztályú nadrág EGYÜTT elérheti a 3. osztályt — a gyártói tanúsítás ezt külön jelöli.</p>
<h2>Kinek kötelező?</h2>
<p>A munkáltató a kockázatértékelés alapján írja elő (Mvt. 56. §) — a gyakorlatban kötelező: közúton és út mellett végzett munkánál, vasúti pályán, repülőtéren, építkezésen ahol munkagép- vagy járműforgalom van, valamint hulladékszállításban és rakodásnál. A KRESZ a járművéből kiszálló sofőrnek is előírja lakott területen kívül.</p>
<h2>Amire kevesen figyelnek: a mosási élettartam</h2>
<p>A címkén jelölt <strong>maximális mosásszám</strong> (tipikusan 25-50×) után a fluoreszcens szín fakulása miatt a ruha már NEM számít szabványosnak — akkor sem, ha „még jól néz ki”. Kopott, olajos, kifakult hi-vis = nincs védelem, és ellenőrzésen hiányosságnak számít.</p>`,
    author: 'TridentShop',
    date: '2026-06-12',
    image: '/images/products/c464_yn.jpg',
    tags: ['hi-vis', 'szabvany', 'kotelezo', 'EN ISO 20471']
  },
  {
    id: 4,
    slug: 'teli-munkavedelmi-bakancs-valasztas',
    title: 'Téli munkavédelmi bakancs: mire figyelj a hideg szezonban?',
    excerpt: 'CI jelölés, bélés, talpszigetelés — így válassz bakancsot fagypont alatti munkához.',
    content: `<h2>Mit jelent a CI jelölés?</h2>
<p>Az EN ISO 20345 szabványban a <strong>CI (Cold Insulation)</strong> a talp hidegszigetelését jelöli: a bakancs -17°C-on, 30 percen át tesztelve legfeljebb 10°C-ot engedhet hűlni a belső térben. Ha rendszeresen dolgozol kültéren télen, ez az első jelölés, amit keress.</p>
<h2>Bélés típusok</h2>
<ul>
<li><strong>Szőrmebélés:</strong> a legmelegebb megoldás, pl. a Portwest FC12 Compositelite típusnál. Kültéri, tartósan hideg munkakörnyezethez.</li>
<li><strong>Thinsulate / textil bélés:</strong> vékonyabb, jól szellőzik — váltakozó kültéri-beltéri munkához praktikus.</li>
</ul>
<h2>Gyakori hiba: a túl szoros méret</h2>
<p>Télen vastagabb zoknit viselünk — ha a bakancs szoros, a láb hamarabb fázik, mert a vérkeringés romlik és nincs szigetelő légréteg. Fél mérettel nagyobbat válassz, mint a nyári lábbelid.</p>
<h2>Talp és csúszásvédelem</h2>
<p>Jeges felületen az SRC jelölésű, mélyprofilos talp a minimum. A hőálló (HRO) talpgumi hidegben is rugalmasabb marad, kevésbé keményedik meg.</p>`,
    author: 'TridentShop',
    date: '2025-01-14',
    image: '/images/products/fc12_bk.jpg',
    tags: ['bakancs', 'teli', 'utmutato']
  },
  {
    id: 5,
    slug: 'latex-nitril-pu-kesztyu-bevonatok',
    title: 'Latex, nitril vagy PU? Munkakesztyű bevonatok összehasonlítása',
    excerpt: 'Melyik bevonat mire való? Gyakorlati összehasonlítás fogás, kopásállóság és ár szerint.',
    content: `<h2>Latex bevonat</h2>
<p>Kiváló rugalmasság és fogásbiztonság, nedves felületen is. Érdesített változata (pl. Portwest A100) építőipari és rakodási munkák kedvence. Hátránya: latex-allergiát okozhat, és olajokkal szemben gyenge.</p>
<h2>Nitril bevonat</h2>
<p>Olaj- és vegyszerálló, nagyon kopásálló — műhelyben, autószerelésben, olajos alkatrészekhez ez a nyerő. Mikrohabosított (foam) változata lélegzik és tapadós marad olajos felületen is.</p>
<h2>PU (poliuretán) bevonat</h2>
<p>A legvékonyabb, legérzékenyebb fogást adó bevonat (pl. Portwest A120). Precíziós szereléshez, elektronikai munkához, csomagoláshoz ideális. Cserébe kevésbé tartós durva felületeken.</p>
<h2>Gyors választó</h2>
<ul>
<li>Építkezés, rakodás → <strong>érdesített latex</strong></li>
<li>Olajos alkatrészek, műhely → <strong>nitril</strong></li>
<li>Precíziós munka, szerelés → <strong>PU</strong></li>
<li>Téli kültéri munka → <strong>bélelt latex/nitril</strong> (pl. A140, A146)</li>
</ul>
<p>Tipp: az EN 388 kód 4 számjegye (kopás, vágás, tépés, átszúrás) alapján hasonlítsd össze a konkrét modelleket.</p>`,
    author: 'TridentShop',
    date: '2025-02-20',
    image: '/images/products/a100_gn.jpg',
    tags: ['kesztyu', 'osszehasonlitas', 'utmutato']
  },
  {
    id: 6,
    slug: 'vedosisak-szabalyok-en397-kihordas',
    title: 'Védősisak szabályok: EN 397, kihordási idő, karbantartás',
    excerpt: 'Meddig használható egy védősisak? Mit ír elő az EN 397, és mikor kell azonnal cserélni?',
    content: `<h2>EN 397 — az ipari védősisak szabványa</h2>
<p>Az EN 397 a sisakhéj ütéscsillapítását és átszúrás-állóságát vizsgálja. Opcionális jelölések: <strong>-30°C</strong> (hidegállóság), <strong>440 V a.c.</strong> (elektromos szigetelés), <strong>LD</strong> (oldalirányú deformáció), <strong>MM</strong> (fémfröccsenés).</p>
<h2>Kihordási idő</h2>
<p>A gyártók jellemzően a <strong>gyártástól számított 5-7 évet</strong> adnak meg (a Portwest PS55-nél 7 év). A gyártási dátum a sisakhéjba nyomva található. A kihordási idő akkor is érvényes, ha a sisak "jól néz ki" — a műanyag UV-fénytől és hőtől öregszik.</p>
<h2>Mikor kell AZONNAL cserélni?</h2>
<ul>
<li>Bármilyen ütés érte — akkor is, ha nem látszik rajta sérülés</li>
<li>Repedés, mélyebb karc a héjon</li>
<li>Kifakult, krétásodó felület (UV-öregedés jele)</li>
<li>Sérült vagy hiányzó sisakkosár</li>
</ul>
<h2>Karbantartás</h2>
<p>Langyos szappanos vízzel tisztítsd, oldószerrel soha. Ne tárold autó műszerfalán vagy tűző napon. A sisakkosár és izzadságpánt külön is cserélhető — érdemes évente frissíteni.</p>`,
    author: 'TridentShop',
    date: '2025-03-18',
    image: '/images/products/ps55_wh.jpg',
    tags: ['sisak', 'szabvany', 'karbantartas']
  },
  {
    id: 7,
    slug: 'munkanadrag-valasztas-zsebek-anyagok',
    title: 'Hogyan válassz munkanadrágot? Anyagok, zsebek, szabás',
    excerpt: 'Pamut vagy kevertszálas? Lengőzseb vagy térdvédő? Gyakorlati szempontok munkanadrág vásárláshoz.',
    content: `<h2>Anyagválasztás</h2>
<p>A klasszikus <strong>65/35 poliészter-pamut</strong> keverék (pl. Kingsmill szövet) jó kompromisszum: strapabíró, gyorsan szárad, kevésbé gyűrődik. A magas pamuttartalom kényelmesebb és jobban szellőzik, de lassabban szárad. A modern stretch anyagok (pl. WX2 széria) mozgáskövetőek — sokat hajolgató munkához érdemes választani.</p>
<h2>Zsebkiosztás</h2>
<ul>
<li><strong>Combzseb (cargo):</strong> telefonnak, mérőszalagnak — az alap munkás-kiosztás (pl. C701)</li>
<li><strong>Lengőzseb (holster):</strong> szerszámoknak, csavaroknak, gyors hozzáféréssel (pl. C720) — burkolóknak, villanyszerelőknek</li>
<li><strong>Térdvédő zseb:</strong> ha sokat térdelsz, EN 14404 térdpárnával kombinálva kötelező darab</li>
</ul>
<h2>Méret és szabás</h2>
<p>A munkanadrág akkor jó, ha guggolásnál nem húz és nem csúszik le. Hosszított szárú változatok magasabb (185 cm+) testalkathoz elérhetők a legtöbb Portwest modellnél.</p>
<h2>UV védelem</h2>
<p>Kültéri munkánál figyeld az UPF jelölést — a C701 például az UV sugárzás 96%-át blokkolja (50+ UPF).</p>`,
    author: 'TridentShop',
    date: '2025-04-22',
    image: '/images/products/c701_bk.jpg',
    tags: ['munkaruha', 'nadrag', 'utmutato']
  },
  {
    id: 8,
    slug: 'teli-munkaruha-retegezes',
    title: 'Téli munkaruházat: a rétegezés művészete',
    excerpt: 'Aláöltözet, polár, télikabát — így öltözz rétegesen, hogy se meg ne fázz, se le ne izzadj.',
    content: `<h2>Miért rétegezz?</h2>
<p>A hideg elleni védelem kulcsa nem egyetlen vastag kabát, hanem a <strong>rétegek közötti levegő</strong>. A rétegezés ráadásul rugalmas: fizikai munkánál levehetsz, pihenőben visszavehetsz egy réteget.</p>
<h2>A három réteg</h2>
<ul>
<li><strong>1. aláöltözet (base layer):</strong> nedvességelvezető funkcionális réteg — a pamut pólót izzadós munkánál kerüld, mert nedvesen hűt</li>
<li><strong>2. szigetelő réteg:</strong> polár pulóver vagy dzseki (pl. Portwest CD871 WX2 Eco polár) — ez tartja a meleget</li>
<li><strong>3. külső réteg:</strong> szél- és vízálló télikabát (pl. CD864, ragasztott varratokkal) — ez zárja ki az időjárást</li>
</ul>
<h2>Amire még figyelj</h2>
<p>A hőveszteség jelentős része a fejnél és a végtagoknál történik: kötött, bélelt sapka (pl. B013 Insulatex), téli kesztyű (A140/A146) és CI jelölésű bakancs nélkül a legjobb kabát sem elég. Munkavédelmi szempont: a külső réteg legyen jól látható vagy viselj rá hi-vis mellényt, ha forgalom közelében dolgozol.</p>`,
    author: 'TridentShop',
    date: '2025-10-15',
    image: '/images/products/cd864_bk.jpg',
    tags: ['munkaruha', 'teli', 'retegezes']
  },
  {
    id: 9,
    slug: 'vedoszemuveg-tipusok-bevonatok',
    title: 'Védőszemüveg típusok: lencsék, bevonatok, színek',
    excerpt: 'Víztiszta, füst, sárga vagy tükrös? Mikor melyik lencsét válaszd, és mit tudnak a bevonatok?',
    content: `<h2>Lencseszínek és felhasználásuk</h2>
<ul>
<li><strong>Víztiszta:</strong> általános beltéri munka — az alapfelszerelés</li>
<li><strong>Füst (sötétített):</strong> kültéri munka napsütésben, UV védelemmel</li>
<li><strong>Sárga (borostyán):</strong> gyenge fényviszonyoknál kontrasztnövelés — hajnali/esti kültéri munka</li>
<li><strong>Tükrös:</strong> erős napfény, visszaverődő felületek (pl. üveg, fém, víz mellett)</li>
</ul>
<h2>Bevonatok</h2>
<p>A <strong>karcolásgátló</strong> bevonat a lencse élettartamát nyújtja, a <strong>párásodásgátló</strong> pedig hideg-meleg váltásnál és maszkviselésnél nélkülözhetetlen. A jó védőszemüvegen (pl. Portwest PR01) mindkettő megvan.</p>
<h2>Szabványok</h2>
<p>Az EN 166 az alapszabvány: az 1-es optikai osztály tartós viselésre való. Az F jelölés kis energiájú ütés elleni védelmet jelent (45 m/s) — forgácsoló, köszörülő munkához a minimum.</p>
<h2>Illeszkedés</h2>
<p>A wrap-around (körbeölelő) forma oldalról is véd és kevésbé enged be port. Ha dioptriás szemüveget hordasz, keress ráhelyezhető (overspec) modellt vagy dioptriás betétes változatot.</p>`,
    author: 'TridentShop',
    date: '2025-06-10',
    image: '/images/products/pr01_cl.jpg',
    tags: ['szemuveg', 'utmutato', 'szabvany']
  },
  {
    id: 10,
    slug: 'en-iso-20345-2022-valtozasok',
    title: 'EN ISO 20345:2022 — mi változott a munkacipő szabványban?',
    excerpt: 'S3S, SC, SR és társai: az új lábbeli-szabvány jelölések magyarázata közérthetően.',
    content: `<h2>Miért újult meg a szabvány?</h2>
<p>Az EN ISO 20345:2022 a 2011-es verziót váltja, pontosabb vizsgálati módszerekkel és új jelölésekkel. Az átállás fokozatos — a boltokban még párhuzamosan találkozol régi és új jelölésű lábbelikkel, mindkettő megfelelő védelmet ad.</p>
<h2>A legfontosabb új jelölések</h2>
<ul>
<li><strong>S3S:</strong> az S3 új változata, ahol a talpátszúrás elleni védelmet fémmentes (textil) lemezzel, új vizsgálattal igazolják (pl. Portwest FC19 Apex)</li>
<li><strong>SC (Scuff Cap):</strong> orrborítás-kopásállóság — térdelve dolgozóknál (burkolók!) hasznos</li>
<li><strong>SR:</strong> csúszásállóság kerámialapon, glicerinnel vizsgálva — a korábbi SRA/SRB/SRC rendszert váltja</li>
<li><strong>FO:</strong> üzemanyagálló talp — az új szabványban már opcionális jelölés</li>
</ul>
<h2>Mit jelent ez vásárláskor?</h2>
<p>Semmi pánik: az alapkategóriák (SB, S1, S1P, S2, S3) megmaradtak. Ha új jelölésű cipőt látsz (pl. "S3S SC FO SR"), az a legfrissebb vizsgálatok szerint tanúsított termék. A régi készletek 2011-es jelöléssel is teljesen legálisan forgalmazhatók.</p>`,
    author: 'TridentShop',
    date: '2025-08-05',
    image: '/images/products/fc19_bkb.jpg',
    tags: ['munkacipo', 'szabvany', 'valtozas']
  },
  {
    id: 11,
    slug: 'overal-vagy-ketreszes-munkaruha',
    title: 'Overál vagy kétrészes munkaruha? Előnyök és hátrányok',
    excerpt: 'Melyik a praktikusabb: az egybeszabott overál vagy a nadrág + kabát kombináció?',
    content: `<h2>Az overál előnyei</h2>
<p>Az egybeszabott overál (pl. Portwest 2802) teljes törzsvédelmet ad: nincs kicsúszó ing, nem megy be a por, forgács vagy festék a derékrésznél. Hajolgatásnál a hát mindig fedett marad. Festéshez, szereléshez, poros munkához klasszikus választás.</p>
<h2>Az overál hátrányai</h2>
<p>A hőszabályozás nehezebb — melegben nem tudod "levenni a felsőt". A mosdóhasználat körülményesebb, és a méretezés is trükkösebb: a felsőtest és a láb arányának is stimmelnie kell.</p>
<h2>A kétrészes előnyei</h2>
<p>Rugalmasság: a nadrág + dzseki (pl. C701 + CD110) kombináció rétegezhető, a részek külön cserélhetők, ha az egyik hamarabb kopik. Fizikai munkánál könnyebb a hőháztartást kezelni.</p>
<h2>Melyiket válaszd?</h2>
<ul>
<li>Festés, poros-forgácsos munka, autószerelés → <strong>overál</strong></li>
<li>Változó intenzitású, vegyes munkakörök → <strong>kétrészes</strong></li>
<li>Kültéri egész éves munka → <strong>kétrészes</strong>, téli kiegészítőkkel</li>
</ul>`,
    author: 'TridentShop',
    date: '2025-09-12',
    image: '/images/products/2802_na.jpg',
    tags: ['munkaruha', 'overal', 'osszehasonlitas']
  },
  {
    id: 12,
    slug: 'munkaltatoi-vedoeszkoz-juttatas-kotelezettsegek',
    title: 'Egyéni védőeszköz juttatás: a munkáltató kötelezettségei röviden',
    excerpt: 'Ki fizeti a munkaruhát? Mit ír elő a munkavédelmi törvény az EV juttatásról?',
    content: `<h2>Az alapszabály</h2>
<p>A munkavédelmi törvény (1993. évi XCIII. tv.) szerint az egyéni védőeszközt a <strong>munkáltató köteles biztosítani, saját költségén</strong> — a védőeszközért a dolgozótól pénz nem kérhető, és az elhasználódott eszközt cserélni kell.</p>
<h2>Írásbeli EV juttatási rend</h2>
<p>2024. január 1-től a védőeszköz-juttatás rendjét <strong>írásban</strong> kell meghatározni: munkakörönként rögzíteni kell, milyen védőeszköz jár (pl. S3 bakancs, vágásbiztos kesztyű, védősisak), milyen szabvány szerint, és milyen kihordási idővel.</p>
<h2>A kockázatértékelés a kiindulópont</h2>
<p>Hogy mely munkakörhöz mi kell, azt a munkahelyi kockázatértékelés alapozza meg — enélkül a juttatási rend csak találgatás. A védőeszközöknek CE jelöléssel és EU-megfelelőségi nyilatkozattal kell rendelkezniük ((EU) 2016/425 rendelet).</p>
<h2>A dolgozó kötelezettségei</h2>
<p>A munkavállaló köteles a védőeszközt rendeltetésszerűen használni és az észlelt hibát jelezni. A használat megtagadása munkajogi következményekkel járhat — de csak akkor, ha a munkáltató a megfelelő eszközt biztosította.</p>
<p><em>Tipp: cégünk, a Trident Shield Group Kft. munkavédelmi szolgáltatásként EV juttatási rend készítésében is segít — keress minket elérhetőségeinken!</em></p>`,
    author: 'TridentShop',
    date: '2026-01-20',
    image: '/images/products/pw90_ye.jpg',
    tags: ['jogszabaly', 'munkaltato', 'vedoeszkoz']
  },
  {
    id: 13,
    slug: 'munkavedelmi-labbeli-apolas-elettartam',
    title: 'Így él tovább a munkavédelmi lábbelid: ápolás és tárolás',
    excerpt: 'Egyszerű szokások, amikkel hónapokkal nyújtható a bakancs élettartama — és a védelme.',
    content: `<h2>A védelem is öregszik</h2>
<p>A munkavédelmi lábbeli nem csak "elkopik" — a talp csúszásgátló képessége, az energiaelnyelő sarok és a vízállóság is romlik idővel. Az ápolás tehát nem esztétikai kérdés, hanem munkavédelmi.</p>
<h2>Napi rutin</h2>
<ul>
<li>Munkanap végén töröld le a sarat — a rászáradt szennyeződés szárítja és repeszti a bőrt</li>
<li>Vedd ki a talpbetétet és hagyd szellőzni — a nedves belső a gombásodás melegágya</li>
<li>Két pár váltogatása drasztikusan növeli mindkettő élettartamát</li>
</ul>
<h2>Heti-havi teendők</h2>
<p>Bőr felsőrésznél (pl. FD03, FC11) havonta bőrápoló balzsam; nubuknál (FC17 Montana Hiker) speciális nubuk-impregnáló. A fűzőt és a varrásokat ilyenkor ellenőrizd is.</p>
<h2>Amit SOHA ne csinálj</h2>
<ul>
<li>Radiátoron, kályha mellett szárítás — a bőr kiszárad, a ragasztás enged</li>
<li>Mosógépben mosás — a védőelemek károsodhatnak</li>
<li>Átázott lábbeli másnapi újrahasználata szárítás nélkül</li>
</ul>
<h2>Mikor kell cserélni?</h2>
<p>Ha a talpprofil 1,5 mm alá kopott, az orrmerevítő ütést kapott, vagy a felsőrész-talp ragasztás enged — a cipő munkavédelmi szempontból elhasználódott, akkor is, ha még "hordható".</p>`,
    author: 'TridentShop',
    date: '2026-03-08',
    image: '/images/products/fc17_br.jpg',
    tags: ['munkacipo', 'karbantartas', 'tippek']
  },
  {
    id: 14,
    slug: 'en-iso-21420-szabvany-magyarazat',
    title: 'Mit jelent az EN ISO 21420 szabvány a védőkesztyűkön?',
    excerpt: 'A védőkesztyűk „alapszabványa” érthetően: mit garantál, mit nem, és miért szerepel minden minőségi kesztyű címkéjén.',
    content: `<h2>Mi az EN ISO 21420?</h2>
<p>Az <strong>EN ISO 21420:2020</strong> a védőkesztyűk <strong>általános követelményeit</strong> rögzíti — 2020-ban váltotta a korábbi EN 420 szabványt. Minden CE-jelölésű védőkesztyűnek meg kell felelnie neki, függetlenül attól, milyen konkrét veszély ellen véd.</p>
<h2>Mit garantál?</h2>
<ul>
<li><strong>Ártalmatlanság:</strong> a kesztyű anyaga maga nem károsíthatja a viselőt — szabályozott a pH-érték (3,5–9,5), bőr kesztyűnél a króm(VI)-tartalom (max. 3 mg/kg), és tiltottak bizonyos allergén azo-színezékek.</li>
<li><strong>Méretezés és kényelem:</strong> egységes méretrendszer (6–11), minimális kézügyesség-követelmény, hogy a kesztyűben dolgozni is lehessen.</li>
<li><strong>Jelölés és tájékoztató:</strong> a kesztyűn olvashatónak kell lennie a gyártónak, típusnak, méretnek és piktogramoknak; kötelező a magyar nyelvű tájékoztató.</li>
</ul>
<h2>Mit NEM garantál?</h2>
<p>Fontos: az EN ISO 21420 <strong>önmagában nem jelent védelmi teljesítményt</strong>! Azt a specifikus szabványok adják hozzá: <strong>EN 388</strong> (mechanikai), <strong>EN 511</strong> (hideg), <strong>EN 407</strong> (hő), <strong>EN ISO 374</strong> (vegyi). Egy kesztyű címkéjén ezért mindig párban szerepelnek: az EN ISO 21420 az „alap”, a többi a konkrét védelem.</p>
<h2>Mire figyelj vásárláskor?</h2>
<p>Ha egy kesztyűn csak „EN 420” szerepel régi jelöléssel, az még a korábbi tanúsítás — nem hibás, de az újabb gyártásoknál már az EN ISO 21420-nak kell szerepelnie. A TridentShop kínálatában minden Portwest kesztyű az új szabvány szerint tanúsított.</p>`,
    author: 'TridentShop',
    date: '2026-07-02',
    image: '/images/products/a140_bk.jpg',
    tags: ['kesztyu', 'szabvany', 'EN ISO 21420']
  },
  {
    id: 15,
    slug: 'kinek-kotelezo-s1-src-munkavedelmi-cipo',
    title: 'Kinek kötelező az S1-es munkavédelmi cipő, és mit jelent az SRC?',
    excerpt: 'S1, S1P, S2, S3 és az SRA/SRB/SRC csúszásállósági osztályok — ki írja elő, és melyik munkakörbe melyik kell.',
    content: `<h2>Ki írja elő a munkavédelmi cipőt?</h2>
<p>Nem jogszabály sorolja fel tételesen, hanem a <strong>munkáltató kockázatértékelése</strong> (Mvt. 56. §): ahol lábsérülés-veszély van — leeső tárgy, átszúrás, csúszós padló, targoncaforgalom —, ott a munkáltató KÖTELES előírni és <strong>ingyenesen biztosítani</strong> a megfelelő védőlábbelit. A dolgozó pedig köteles viselni.</p>
<h2>Az S-kategóriák (EN ISO 20345)</h2>
<ul>
<li><strong>S1:</strong> 200 J orrmerevítő + zárt sarok + antisztatikus + energiaelnyelő sarok + olajálló talp. Beltéri, száraz munkára: raktár, üzem, szerelde.</li>
<li><strong>S1P:</strong> S1 + átszúrás elleni talplemez. Műhely, építkezés beltere, ahol szög/forgács kerülhet a talp alá.</li>
<li><strong>S2:</strong> S1 + vízfelvétel-gátló felsőrész. Nedves környezet: konyha, élelmiszeripar, kültér.</li>
<li><strong>S3:</strong> S2 + átszúrásgátló + profilos talp. Építőipar, kültéri terep — a legteljesebb védelem.</li>
</ul>
<h2>Mit jelent az SRA / SRB / SRC?</h2>
<p>Ez a talp <strong>csúszásállósági</strong> minősítése — a kategóriától FÜGGETLEN jelölés:</p>
<ul>
<li><strong>SRA:</strong> kerámia padlón, mosószeres vízzel tesztelve — beltéri, nedves padlóra (pl. konyha).</li>
<li><strong>SRB:</strong> acél padlón, glicerinnel tesztelve — ipari, olajos felületre.</li>
<li><strong>SRC:</strong> MINDKÉT teszten megfelelt — a legbiztonságosabb választás, vegyes környezetbe.</li>
</ul>
<h2>Gyakorlati ökölszabály</h2>
<p>Konyha, vendéglátás, élelmiszeripar: <strong>S2 + SRC</strong>. Raktár, összeszerelés: <strong>S1/S1P + SRC</strong>. Építkezés, kültér: <strong>S3 + SRC</strong>. Ha bizonytalan vagy, a kockázatértékelést végző munkavédelmi szakember tud pontos kategóriát mondani — vagy kérdezz minket.</p>`,
    author: 'TridentShop',
    date: '2026-07-10',
    image: '/images/products/ft16_bb.jpg',
    tags: ['munkacipo', 'szabvany', 'SRC', 'kotelezo']
  },
  {
    id: 16,
    slug: 'vendeglatas-egyeni-vedoeszkozok',
    title: 'Milyen egyéni védőeszközök kellenek a vendéglátásban?',
    excerpt: 'Konyhai csúszás, vágás, forrázás, forró zsiradék — a vendéglátós munkahelyek kötelező és ajánlott védőeszközei egy helyen.',
    content: `<h2>Miért kiemelt terület a vendéglátás?</h2>
<p>A konyhai munkabalesetek túlnyomó része három forrásból jön: <strong>csúszós padló</strong> (zsír + víz), <strong>vágás</strong> (kés, szeletelőgép) és <strong>égés/forrázás</strong>. Mindhárom ellen létezik szabványos védőeszköz — és a munkáltatónak írásos <strong>EV juttatási rendben</strong> kell rögzítenie, kinek mi jár (2024-től kötelezően írásban).</p>
<h2>Lábbeli: az első számú tétel</h2>
<p>Konyhába <strong>S2 kategóriájú, SRC csúszásállóságú</strong> cipő való: vízfelvétel-gátló felsőrész + a kerámia/mosószeres teszten is megfelelt talp. A hagyományos „konyhai klumpa” csak akkor elég, ha zárt sarkú és SRC minősítésű.</p>
<h2>Kézvédelem</h2>
<ul>
<li><strong>Vágásálló kesztyű (EN 388, Cut C vagy magasabb):</strong> csontozáshoz, szeletelőgép tisztításához. A fém láncing kesztyű a hentesmunka klasszikusa.</li>
<li><strong>Hőálló kesztyű/fogókesztyű (EN 407):</strong> sütőből kivételhez — a konyharuha nem védőeszköz!</li>
<li><strong>Egyszer használatos nitril kesztyű:</strong> hidegkonyhai, higiéniai feladatokhoz (a latex allergén lehet).</li>
</ul>
<h2>Testvédelem</h2>
<p>A klasszikus <strong>dupla mellrészes séfkabát</strong> nem hagyomány, hanem védelem: a forró fröccsenés ellen véd, és gyorsan lerántható, ha forró folyadék ömlik rá. Hozzá hosszú, elöl zárt kötény — olajsütőnél vízhatlan változat.</p>
<h2>Checklist egy átlagos konyhára</h2>
<ul>
<li>S2 SRC cipő — minden konyhai dolgozónak</li>
<li>Vágásálló kesztyű — előkészítő/hentes feladatkörben</li>
<li>Hőálló fogókesztyű — sütő-főző poszton</li>
<li>Séfkabát + kötény — a hőterhelésnek kitett posztokon</li>
<li>Csúszásmentes padlóra figyelmeztető tábla takarításkor</li>
</ul>`,
    author: 'TridentShop',
    date: '2026-07-18',
    image: '/images/products/s822.webp',
    tags: ['vendeglatas', 'vedoeszkoz', 'utmutato']
  },
  {
    id: 17,
    slug: 'epitoipar-kotelezo-vedoeszkozok',
    title: 'Építőipari védőeszköz-csomag: mi kötelező a munkaterületen?',
    excerpt: 'Sisaktól a leesés elleni védelemig — az építőipari munkahelyek tipikus védőeszköz-előírásai és a mögöttük álló szabványok.',
    content: `<h2>Az építőipari „alapfelszerelés”</h2>
<p>Építési munkaterületen a kockázatértékelés szinte mindig előírja az alábbiakat:</p>
<ul>
<li><strong>Védősisak (EN 397):</strong> leeső tárgy ellen. A gyártástól számított kihordási ideje véges (tipikusan 3-5 év) — a sisak belsejében lévő dátumot ellenőrizd!</li>
<li><strong>S3 védőbakancs:</strong> orrmerevítő + átszúrásgátló talp + profilos, terepre való talp.</li>
<li><strong>Jól láthatósági ruházat (EN ISO 20471):</strong> gép- és járműforgalom mellett 2., közút mellett 3. osztály.</li>
<li><strong>Védőkesztyű (EN 388):</strong> anyagmozgatáshoz mechanikai védelem; zsaluzáshoz, vasszereléshez magasabb vágásállóság.</li>
</ul>
<h2>Munkafüggő kiegészítők</h2>
<ul>
<li><strong>Szemvédelem (EN 166):</strong> vágás, csiszolás, vésés — a szilánk ellen a dioptriás szemüveg NEM véd.</li>
<li><strong>Hallásvédelem (EN 352):</strong> 85 dB felett kötelező a viselés (bontás, betonvágás szinte mindig felette van).</li>
<li><strong>Légzésvédelem (EN 149):</strong> por ellen FFP2, kvarcpor/azbesztgyanús bontás FFP3.</li>
<li><strong>Leesés elleni védelem (EN 361 teljes testheveder):</strong> 2 méter feletti, védőkorlát nélküli munkavégzésnél kötelező — a derékövhöz rögzített kötél NEM helyettesíti.</li>
</ul>
<h2>A leggyakoribb ellenőrzési hiányosságok</h2>
<p>Hatósági ellenőrzésen tipikusan ezekbe kötnek bele: lejárt kihordású sisak, kifakult hi-vis, hiányzó írásos EV juttatási rend, valamint az, hogy a védőeszköz „ki van adva”, de senki nem viseli. A védőeszköz viselése a dolgozó KÖTELESSÉGE is (Mvt. 60. §) — a munkáltatónak ezt számon is kell kérnie.</p>`,
    author: 'TridentShop',
    date: '2026-07-24',
    image: '/images/products/s427yer2.webp',
    tags: ['epitoipar', 'vedoeszkoz', 'kotelezo', 'utmutato']
  },
  {
    id: 18,
    slug: 'ffp1-ffp2-ffp3-maszk-kulonbsegek',
    title: 'FFP1, FFP2 vagy FFP3? Légzésvédő maszkok érthetően',
    excerpt: 'Az EN 149 szerinti részecskeszűrő maszkok osztályai, az NR/R és D jelölések, és hogy melyik munkához melyik kell.',
    content: `<h2>Mit szűr egy FFP maszk?</h2>
<p>Az <strong>EN 149</strong> szerinti részecskeszűrő félálarcok <strong>szilárd és folyékony részecskék</strong> (por, füst, aeroszol) ellen védenek — gázok és gőzök ellen NEM! Utóbbihoz szűrőbetétes félálarc kell (EN 140 + gázszűrő).</p>
<h2>A három osztály</h2>
<ul>
<li><strong>FFP1:</strong> a munkahelyi határérték legfeljebb 4-szereséig. Durva, nem mérgező por: takarítás, kézi csiszolás puhafán.</li>
<li><strong>FFP2:</strong> a határérték 10-szereséig. Finompor, fémpor, betonpor, fapor — az ipari felhasználás leggyakoribb osztálya.</li>
<li><strong>FFP3:</strong> a határérték 20-szorosáig. Mérgező porok, kvarcpor, rozsdamentes hegesztési füst, penész-spórák. Bontási munkáknál ez a minimum.</li>
</ul>
<h2>A kiegészítő jelölések</h2>
<ul>
<li><strong>NR</strong> (non-reusable): egy műszakra való — 8 óra után dobd el.</li>
<li><strong>R</strong> (reusable): tisztítható, több műszakban használható.</li>
<li><strong>D:</strong> kiállta a dolomitpor-eltömődési tesztet — poros környezetben tovább marad kényelmes a légzés.</li>
<li><strong>Szelepes változat:</strong> a kilégzést könnyíti (a szelep KIFELÉ enged) — melegben, hosszú viselésnél sokkal komfortosabb.</li>
</ul>
<h2>A leggyakoribb hiba</h2>
<p>A maszk csak akkor véd, ha <strong>zár az arcon</strong>: borosta, rossz méret vagy lazán viselt pánt mellett az osztály mit sem ér. Illeszkedés-ellenőrzés: tenyérrel fedd le a maszkot és fújj ki — ha a széleknél érzed a levegőt, állítsd újra a pántokat.</p>`,
    author: 'TridentShop',
    date: '2026-07-29',
    image: 'https://d11ak7fd9ypfb7.cloudfront.net/styles1100px/P210WHR.jpg',
    tags: ['legzesvedelem', 'szabvany', 'FFP2', 'utmutato']
  },
  {
    id: 19,
    slug: 'hallasvedelem-mikor-kotelezo-en352',
    title: 'Hallásvédelem: mikortól kötelező, és füldugó vagy fültok?',
    excerpt: 'A 80 és 85 dB szabály, az SNR érték jelentése, és a füldugó kontra fültok döntés szempontjai az EN 352 alapján.',
    content: `<h2>A két bűvös szám: 80 és 85 dB</h2>
<p>A magyar szabályozás (66/2005. EüM rendelet) két beavatkozási szintet határoz meg napi zajexpozícióra:</p>
<ul>
<li><strong>80 dB felett:</strong> a munkáltatónak hallásvédő eszközt kell <strong>biztosítania</strong> — a viselés még választható.</li>
<li><strong>85 dB felett:</strong> a hallásvédő <strong>viselése kötelező</strong>, a zajos zónát jelölni kell.</li>
</ul>
<p>Viszonyításképp: sarokcsiszoló ~100 dB, láncfűrész ~110 dB, betonvágó ~105 dB — ezek mellett percek alatt kimeríthető a napi „zajkeret”.</p>
<h2>Mit jelent az SNR érték?</h2>
<p>Az EN 352 szerinti hallásvédőkön szereplő <strong>SNR</strong> (Single Number Rating) az átlagos zajcsillapítás dB-ben. Egy SNR 30-as füldugó a ~100 dB-es környezetet kb. 70 dB-re csillapítja. Cél: a fülnél maradó zaj 70-80 dB közé kerüljön — a TÚLcsillapítás is veszélyes, mert nem hallod a figyelmeztető jelzéseket.</p>
<h2>Füldugó vagy fültok?</h2>
<ul>
<li><strong>Füldugó:</strong> olcsó, könnyű, melegben kényelmesebb, sisakkal/szemüveggel jól kombinálható. Hátránya: helyes behelyezést igényel, koszos kézzel higiéniai kockázat.</li>
<li><strong>Fültok:</strong> gyorsan fel-le vehető (szakaszos zajnál ideális), egyszerű ellenőrizni a viselését. Hátránya: melegben izzaszt, szemüvegszárral résveszteség.</li>
</ul>
<p>Ökölszabály: <strong>egész napos folyamatos zaj → füldugó; szakaszos, ki-be járkálós zaj → fültok.</strong> 100 dB feletti környezetben a kettő kombinálható is.</p>`,
    author: 'TridentShop',
    date: '2026-08-01',
    image: '/images/products/ep17_ye.jpg',
    tags: ['hallasvedelem', 'szabvany', 'kotelezo', 'utmutato']
  }
];

// Az alapcikkek verziója: emeld, ha a defaultBlogPosts bővül/változik!
// A régebbi verzióval mentett localStorage-ból automatikusan migrálunk:
// az alapcikkek frissülnek, az admin által létrehozott cikkek megmaradnak.
const BLOG_SEED_VERSION = 3;
const BLOG_SEED_VERSION_KEY = 'ms_blog_seed_version';

export const getBlogPosts = () => {
  let posts = safeGet(STORAGE_KEYS.BLOG_POSTS, null);
  if (!posts) {
    if (isSupabaseEnabled) {
      // Látogató nem írhat az adatbázisba: az alapcikkeket memóriából szolgáljuk ki.
      // Az admin első blog-mentése menti majd őket véglegesen.
      memCache[STORAGE_KEYS.BLOG_POSTS] = defaultBlogPosts;
    } else {
      safeSet(STORAGE_KEYS.BLOG_POSTS, defaultBlogPosts);
      localSet(BLOG_SEED_VERSION_KEY, BLOG_SEED_VERSION);
    }
    posts = defaultBlogPosts;
  } else if (!isSupabaseEnabled) {
    // Elavult seed a localStorage-ban? Alapcikkek frissítése, admin-cikkek megtartása.
    const storedVersion = parseInt(localGet(BLOG_SEED_VERSION_KEY, 0)) || 0;
    if (storedVersion < BLOG_SEED_VERSION) {
      const defaultIds = new Set(defaultBlogPosts.map(p => p.id));
      const customPosts = posts.filter(p => p.isCustom || !defaultIds.has(p.id));
      posts = [...defaultBlogPosts, ...customPosts];
      safeSet(STORAGE_KEYS.BLOG_POSTS, posts);
      localSet(BLOG_SEED_VERSION_KEY, BLOG_SEED_VERSION);
    }
  } else {
    // Supabase mód, létező mentett lista: az alapcikkek MEGJELENÍTÉSKOR mindig a
    // kódban lévő friss változatból jönnek, a mentett listából csak az admin által
    // létrehozott (nem alap-id-jú) cikkeket vesszük át. Írás nem történik — a
    // látogató nem írhat KV-t; az admin következő blog-mentése rögzíti véglegesen.
    const defaultIds = new Set(defaultBlogPosts.map(p => p.id));
    const customPosts = posts.filter(p => p.isCustom || !defaultIds.has(p.id));
    posts = [...defaultBlogPosts, ...customPosts];
  }
  // GYIK hozzáfűzése slug alapján (a régebben mentett cikkekhez is)
  return posts
    .map(p => (!p.faq && BLOG_FAQS[p.slug]) ? { ...p, faq: BLOG_FAQS[p.slug] } : p)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Cikkenkénti GYIK (a cikkoldal GYIK-szekciója + FAQPage schema tölti be)
const BLOG_FAQS = {
  'hogyan-valassz-munkacipot': [
    { q: 'Mi a különbség az S1 és az S1P munkavédelmi cipő között?', a: 'Az S1 orrmerevítős, antisztatikus, zárt sarkú cipő beltéri, száraz munkakörnyezetbe. Az S1P mindezt átszúrás elleni talplemezzel egészíti ki — építkezésre, műhelybe, ahol szög vagy éles törmelék kerülhet a talp alá, S1P a minimum.' },
    { q: 'Melyik kategória kell kültéri munkához?', a: 'Kültérre az S3 az ajánlott: vízálló felsőrész, átszúrásbiztos talplemez és profilos, csúszásgátló talp egyben. Esős, sáros terepen ez a biztonságos választás.' },
    { q: 'Milyen méretet válasszak munkavédelmi cipőből?', a: 'A megszokott utcai méretedet — a Portwest lábbelik mérethűek. Ha vastag, téli zoknival hordanád, fél számmal nagyobb javasolt. Ha mégsem jó, 14 napon belül cseréljük.' }
  ],
  'munkavedelmi-kesztyu-kategoriak': [
    { q: 'Mit jelent az EN 388 szabvány a kesztyűn?', a: 'Az EN 388 a mechanikai kockázatok elleni védelem szabványa: a kesztyűn lévő 4-6 karakteres kód a kopás-, vágás-, szakítás- és átszúrás-állóságot (plusz újabban az ISO-vágásállóságot és ütésvédelmet) jelzi. Minél nagyobb a szám, annál erősebb a védelem.' },
    { q: 'Milyen kesztyű kell precíziós munkához?', a: 'Vékony, PU- vagy nitril-mártott, varrat nélküli kötött kesztyű (pl. 13-15-ös gauge) — megtartja a tapintásérzékenységet, mégis véd. Ilyen például a Portwest A120 PU-tenyérmártott modell.' },
    { q: 'Vágásveszélyes munkához melyik kesztyűt válasszam?', a: 'Kifejezetten vágásbiztos (EN 388 szerint C-F vágási szintű) kesztyűt — üveg, lemez, penge közelében ez kötelező. A webshopban külön alkategóriában találod a vágásbiztos modelleket.' }
  ],
  'jol-lathatosagi-ruha-szabvany': [
    { q: 'Mit jelent az EN ISO 20471 osztályozás?', a: 'A szabvány 3 osztályba sorolja a láthatósági ruházatot a fluoreszkáló háttéranyag és a fényvisszaverő csík felülete alapján. A 3. osztály a legmagasabb — közúton, éjszakai munkánál jellemzően ezt írják elő.' },
    { q: 'Sárga vagy narancs láthatósági ruhát vegyek?', a: 'Mindkettő szabványos; a választást a munkakörnyezet dönti el. Zöld növényzet mellett a narancs, földes-barnás környezetben a sárga üt el jobban. Vasútnál jellemzően a narancs az előírás.' },
    { q: 'Meddig marad szabványos egy hi-vis ruha?', a: 'Amíg a fluoreszkáló szín ki nem fakul és a fényvisszaverő csík sértetlen. Kb. 25-50 mosás után (címkétől függően) a védelmi képesség csökken — kopottan, szennyezetten már nem számít láthatósági ruhának.' }
  ],
  'teli-munkavedelmi-bakancs-valasztas': [
    { q: 'Mit jelent a CI jelölés a téli bakancson?', a: 'A CI (Cold Insulation) a hideg elleni talpszigetelést jelzi: a szabványteszt szerint -17 °C-on 30 percig legfeljebb 10 °C-ot hűlhet a talpbélés. Téli kültéri munkához ezt keresd.' },
    { q: 'Bélelt vagy béleletlen bakancs télre?', a: 'Tartósan kültéri munkához szőrmebéleléses modell (pl. Portwest FC12), változó hőmérsékletű (raktár-udvar) munkához inkább CI-talpas, béleletlen bakancs jó gyapjú zoknival — így nem izzad be.' },
    { q: 'A vízállóság ugyanaz, mint a WR jelölés?', a: 'Az S2/S3 kategória vízlepergető felsőrészt jelent (WRU), a teljes cipő vízállóságát a külön WR jelölés adja. Latyakos, tocsogós terepre WR vagy magas szárú S3 ajánlott.' }
  ],
  'latex-nitril-pu-kesztyu-bevonatok': [
    { q: 'Melyik bevonat a legjobb olajos munkához?', a: 'A nitril — kiváló olaj- és zsírállóság, jó kopásállóság mellett. A latex olajjal érintkezve gyorsan gyengül, a PU pedig inkább száraz, precíz munkára való.' },
    { q: 'Mi a latex kesztyű előnye és hátránya?', a: 'Előnye a kiemelkedő tapadás nedves felületen is és a rugalmasság — építőipari, kertészeti munkára ideális. Hátránya az olajérzékenység, és hogy latexallergiásoknak nem ajánlott.' },
    { q: 'Mikor válasszak PU-bevonatú kesztyűt?', a: 'Szereléshez, elektronikai és precíziós munkához: a PU vékony, érzékeny fogást ad, nem morzsálódik, és a legtöbb modell érintőképernyő-kompatibilis.' }
  ],
  'vedosisak-szabalyok-en397-kihordas': [
    { q: 'Meddig használható egy EN 397-es védősisak?', a: 'A gyártók jellemzően a gyártástól számított 3-5 évet adnak meg (a héj anyagától függően) — a gyártási dátum a sisak belsejében található. UV-nak kitett, karcos, ütést kapott sisakot azonnal cserélni kell.' },
    { q: 'Ütést kapott a sisakom, de nem látszik rajta sérülés. Használhatom?', a: 'Nem. A héj mikrorepedései szabad szemmel nem látszanak, de a következő ütésnél már nem véd. Leesett, ütést kapott sisakot mindig cserélj.' },
    { q: 'Lehet matricázni vagy festeni a védősisakot?', a: 'Csak a gyártó által engedélyezett módon — az oldószeres festékek és egyes ragasztók gyengíthetik a héjat. Jelöléshez használj a gyártó által jóváhagyott matricát.' }
  ],
  'munkanadrag-valasztas-zsebek-anyagok': [
    { q: 'Milyen anyagú munkanadrág a legstrapabíróbb?', a: 'A pamut-poliészter keverék (jellemzően 35/65 vagy 60/40) jó egyensúly: a poliészter a kopásállóságot, a pamut a kényelmet adja. Igénybevett részeken (térd, zsebek) az Oxford- vagy Cordura-erősítés számít igazán.' },
    { q: 'Mire jó a holster (lengő) zseb?', a: 'A nadrág elejére kihajtható erősített zsebekben a leggyakoribb kéziszerszámok azonnal elérhetők — burkolóknak, ácsoknak, villanyszerelőknek nagy időmegtakarítás. Használaton kívül visszatűrhető.' },
    { q: 'Kell-e térdvédő-zsebes nadrág?', a: 'Ha naponta térdelsz (burkolás, padlózás, szerelés), igen: az EN 14404 szerinti térdvédő betét csak térdvédő-zsebes nadrágban használható szabványosan.' }
  ],
  'teli-munkaruha-retegezes': [
    { q: 'Hogyan öltözzek rétegesen téli fizikai munkához?', a: 'Három réteg: nedvességelvezető aláöltözet (nem pamut!), szigetelő középréteg (polár, pulóver), majd szél- és vízálló külső réteg. Fizikai munkánál a lélegzőképesség ugyanolyan fontos, mint a szigetelés.' },
    { q: 'Miért ne pamut aláöltözetben dolgozzak télen?', a: 'A pamut magába szívja az izzadságot és nedves marad — a nedves ruha pedig hűt. A funkcionális (poliészter/gyapjú) aláöltözet elvezeti a nedvességet, így szárazon és melegen tart.' },
    { q: 'Mit jelent a dzsekiknél a 3 az 1-ben kialakítás?', a: 'Kivehető belső réteget (polár vagy steppelt bélés): külön hordható átmeneti időben, összekapcsolva télikabát. Ilyen például a Portwest TK50 és a CD864.' }
  ],
  'vedoszemuveg-tipusok-bevonatok': [
    { q: 'Mit jelent a K és N jelölés a védőszemüvegen?', a: 'A K a karcálló, az N a páramentes bevonatot jelzi az EN 166/168 szerint. Fizikai munkához érdemes mindkettőt választani — a karcos vagy párás lencse önmagában is balesetveszély.' },
    { q: 'Dioptriás szemüveg fölé milyen védőszemüveg jó?', a: 'A gumipántos, zárt védőszemüvegek (goggle) és a "látogató" típusú, szemüveg fölé húzható modellek. A webshop gumipántos alkategóriájában találod ezeket.' },
    { q: 'Sötétített védőszemüveget mikor használjak?', a: 'Kültéri, erős napfényben végzett munkához (füstszínű lencse), illetve hegesztés-közeli segédmunkához a megfelelő árnyalati fokozatú lencsével. Beltérre a víztiszta, UV-szűrős lencse való.' }
  ],
  'en-iso-20345-2022-valtozasok': [
    { q: 'Mi változott az EN ISO 20345:2022-ben a régi szabványhoz képest?', a: 'A legfontosabbak: új S3S/S1PS kategóriák a nem fém talplemezes lábbelikre, új csúszásállósági vizsgálat (SR jelölés), valamint a karcálló orr-rész (SC) és a létrafok-tapadás (LG) opcionális jelölése.' },
    { q: 'A régi szabvány szerinti cipőm még használható?', a: 'Igen — a 20345:2011 szerint tanúsított lábbelik a tanúsítványuk lejártáig forgalomban maradhatnak és használhatók. Új beszerzésnél viszont érdemes már a 2022-es jelölésű modellt választani.' },
    { q: 'Mit jelent az FO jelölés?', a: 'Az üzemanyag- és olajálló talpat (Fuel & Oil resistant). A 2022-es szabványban ez már opcionális kiegészítő jelölés — műhelyben, gépek környezetében hasznos.' }
  ],
  'overal-vagy-ketreszes-munkaruha': [
    { q: 'Mikor jobb az overál, mint a kétrészes munkaruha?', a: 'Ahol a derékrész védelme kritikus: fekve-guggolva végzett szerelésnél, festésnél, poros környezetben az overál nem csúszik fel, nem enged be szennyeződést. Cserébe a hőszabályozása kötöttebb.' },
    { q: 'Miért népszerűbb mégis a kétrészes szett?', a: 'Rugalmasabb: a kabát levehető melegben, a nadrág önállóan is hordható, és a méretezés is pontosabb — más felső- és alsóméret kombinálható. A legtöbb szakmában ez a praktikusabb.' },
    { q: 'Mi az a melles nadrág (kantáros), és kinek való?', a: 'A derék fölé érő, pántos nadrág: a derék és a vese táját is védi, nem csúszik le hajolgatásnál. Kültéri fizikai munkára, télre kifejezetten jó választás.' }
  ],
  'munkaltatoi-vedoeszkoz-juttatas-kotelezettsegek': [
    { q: 'Ki fizeti a munkavédelmi eszközöket: a munkáltató vagy a dolgozó?', a: 'Mindig a munkáltató — a munkavédelmi törvény (Mvt. 56. §) szerint az egyéni védőeszközt a munkáltató saját költségén köteles biztosítani, és a dolgozóra ez át nem hárítható.' },
    { q: 'Kötelező-e írásba foglalni a védőeszköz-juttatás rendjét?', a: 'Igen, 2024. január 1-jétől az egyéni védőeszköz juttatási rendjét írásban kell meghatározni, munkakörönként. Ennek elkészítésében a Trident Shield Group szolgáltatásként is segít.' },
    { q: 'Milyen gyakran kell cserélni a védőeszközöket?', a: 'A juttatási rendben rögzített kihordási idő szerint, de elhasználódás, sérülés esetén azonnal. A védelmi képességét vesztett eszköz (kopott talp, sérült sisak) nem számít védőeszköznek.' }
  ],
  'munkavedelmi-labbeli-apolas-elettartam': [
    { q: 'Hogyan szárítsam a beázott munkavédelmi bakancsot?', a: 'Szobahőmérsékleten, kitömve (újságpapír) és a talpbetétet kivéve — soha ne radiátoron vagy kályha mellett, mert a bőr kiszárad és a ragasztás enged.' },
    { q: 'Mikor kell cserélni a munkavédelmi cipőt?', a: 'Ha a talpprofil 1,5 mm alá kopott, az orrmerevítő ütést kapott, vagy a talp-felsőrész ragasztás enged. Ilyenkor munkavédelmi szempontból elhasználódott, akkor is, ha még hordható.' },
    { q: 'Megéri két pár cipőt váltogatni?', a: 'Igen — a bőr és a bélés így ki tud száradni két viselés között, ami mindkét pár élettartamát jelentősen (akár másfélszeresére) növeli, és a lábgomba kockázatát is csökkenti.' }
  ],
  'en-iso-21420-szabvany-magyarazat': [
    { q: 'Mi a különbség az EN 420 és az EN ISO 21420 között?', a: 'Az EN ISO 21420:2020 a korábbi EN 420 utódja: ugyanazt a szerepet tölti be (a védőkesztyűk általános követelményei), de szigorúbb ártalmatlansági előírásokkal — pl. a króm(VI)- és allergén azo-színezék határértékekkel. Az újonnan tanúsított kesztyűkön már az új jelölés szerepel.' },
    { q: 'Elég, ha egy kesztyűn csak EN ISO 21420 jelölés van?', a: 'Nem — ez csak az alapkövetelményeket (ártalmatlanság, méretezés, jelölés) igazolja. A konkrét védelmet a mellette szereplő specifikus szabvány adja: EN 388 mechanikai, EN 511 hideg, EN 407 hő, EN ISO 374 vegyi védelemhez.' },
    { q: 'Mit jelentenek a kesztyűméretek (6-11)?', a: 'A kézkörméreten alapuló egységes EU-méretezés: a 6-os a legkisebb (kb. 152 mm kézkörméret), a 11-es a legnagyobb. Jól illeszkedő kesztyűvel a kézügyesség is megmarad — a túl nagy kesztyű önmagában baleseti kockázat.' }
  ],
  'kinek-kotelezo-s1-src-munkavedelmi-cipo': [
    { q: 'Ki dönti el, hogy kell-e munkavédelmi cipő?', a: 'A munkáltató, a munkavédelmi kockázatértékelés alapján (Mvt. 56. §). Ahol lábsérülés-veszély áll fenn, ott köteles ingyenesen biztosítani a megfelelő kategóriájú védőlábbelit, a munkavállaló pedig köteles viselni.' },
    { q: 'Mit jelent az SRC jelölés a munkacipőn?', a: 'A talp csúszásállósági minősítését: az SRC azt jelenti, hogy a cipő a kerámia+mosószeres (SRA) ÉS az acél+glicerines (SRB) csúszásteszten is megfelelt — vagyis vegyes, nedves és olajos padlón is a legjobb tapadást adja.' },
    { q: 'Konyhába milyen munkavédelmi cipő kell?', a: 'S2 kategóriájú, SRC csúszásállóságú, zárt sarkú cipő: az S2 vízfelvétel-gátló felsőrészt ad a nedves környezethez, az SRC pedig a zsíros-vizes padlón is csúszásbiztos talpat.' }
  ],
  'vendeglatas-egyeni-vedoeszkozok': [
    { q: 'Kötelező a csúszásmentes cipő a konyhában?', a: 'Ha a kockázatértékelés csúszásveszélyt állapít meg — konyhában gyakorlatilag mindig —, akkor igen: a munkáltatónak S2/SRC minősítésű lábbelit kell biztosítania, és a viselése kötelező.' },
    { q: 'A konyharuha használható edényfogásra?', a: 'Nem — a konyharuha nem védőeszköz, nedvesen pedig kifejezetten átvezeti a hőt. Sütőből kivételhez EN 407 szerinti hőálló fogókesztyű való.' },
    { q: 'Milyen kesztyű kell csontozáshoz?', a: 'EN 388 szerinti, legalább Cut C vágásállóságú kesztyű; intenzív hentesmunkához a fém láncing kesztyű az iparági standard.' }
  ],
  'epitoipar-kotelezo-vedoeszkozok': [
    { q: 'Meddig használható egy védősisak?', a: 'A gyártó által megadott kihordási ideig — tipikusan a gyártástól számított 3-5 évig (a dátum a sisak belsejében található). UV-fénynek kitett, repedt vagy ütést kapott sisakot azonnal cserélni kell.' },
    { q: 'Mikor kötelező a leesés elleni védelem?', a: '2 méter feletti, védőkorlát nélküli munkavégzésnél: EN 361 szerinti teljes testheveder a hozzá tartozó rögzítéssel. A deréköv önmagában nem minősül leesés elleni védelemnek.' },
    { q: 'Hányas osztályú hi-vis kell építkezésre?', a: 'Telephelyen belüli gép-/járműforgalom mellett 2. osztály, közút mellett vagy gyorsforgalmi útnál 3. osztály (hosszú ujjú, törzset és végtagokat is fedő szett).' }
  ],
  'ffp1-ffp2-ffp3-maszk-kulonbsegek': [
    { q: 'Véd az FFP maszk gázok és gőzök ellen?', a: 'Nem — az EN 149 szerinti FFP maszkok csak szilárd és folyékony részecskék (por, füst, aeroszol) ellen védenek. Gázokhoz, gőzökhöz szűrőbetétes álarc kell megfelelő gázszűrővel.' },
    { q: 'Mit jelent a maszkon az NR és az R jelölés?', a: 'NR (non-reusable): egy műszakra való, 8 óra használat után eldobandó. R (reusable): tisztítható és több műszakban is használható.' },
    { q: 'Betonvágáshoz milyen maszk kell?', a: 'A kvarcport tartalmazó betonpor miatt legalább FFP3 — a keletkező finompor rákkeltő kvarctartalma miatt az FFP2 nem elegendő.' }
  ],
  'hallasvedelem-mikor-kotelezo-en352': [
    { q: 'Hány decibeltől kötelező a hallásvédő?', a: '85 dB napi zajexpozíció felett a viselés kötelező; már 80 dB felett biztosítania kell a munkáltatónak (66/2005. EüM rendelet).' },
    { q: 'Mit jelent az SNR érték a füldugón?', a: 'Az átlagos zajcsillapítást dB-ben: egy SNR 30-as eszköz a 100 dB-es zajt kb. 70 dB-re csökkenti. A cél a 70-80 dB közötti maradó zajszint — a túlcsillapítás is kerülendő.' },
    { q: 'Füldugó vagy fültok a jobb?', a: 'Folyamatos, egész napos zajnál a füldugó kényelmesebb; szakaszos, ki-be járkálós munkánál a gyorsan le-fel vehető fültok praktikusabb. 100 dB felett a kettő kombinálható.' }
  ]
};

export const getBlogPostBySlug = (slug) => {
  return getBlogPosts().find(p => p.slug === slug);
};

export const saveBlogPost = (post) => {
  const posts = getBlogPosts();
  if (post.id) {
    // Update
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      posts[idx] = { ...posts[idx], ...post, slug: slugify(post.title) };
    }
  } else {
    // New - isCustom jelöléssel, hogy a seed-migráció soha ne írja felül
    const maxId = Math.max(...posts.map(p => p.id), 100);
    posts.push({
      ...post,
      id: maxId + 1,
      isCustom: true,
      slug: slugify(post.title),
      date: post.date || new Date().toISOString().split('T')[0],
      author: post.author || 'TridentShop'
    });
  }
  safeSet(STORAGE_KEYS.BLOG_POSTS, posts);
  return true;
};

export const deleteBlogPost = (id) => {
  const posts = getBlogPosts().filter(p => p.id !== id);
  safeSet(STORAGE_KEYS.BLOG_POSTS, posts);
  return true;
};

// ======================== KUPONOK ========================

export const getCoupons = () => safeGet(STORAGE_KEYS.COUPONS, []);

export const saveCoupon = (coupon) => {
  const coupons = getCoupons();
  const code = (coupon.code || '').trim().toUpperCase();
  if (!code) return { error: 'Hiányzó kuponkód' };
  const idx = coupons.findIndex(c => c.code === code);
  const entry = {
    code,
    type: coupon.type === 'fixed' ? 'fixed' : 'percent',   // percent: %, fixed: Ft
    value: Math.max(0, parseFloat(coupon.value) || 0),
    minOrder: Math.max(0, parseInt(coupon.minOrder) || 0),
    expiry: coupon.expiry || null,                          // YYYY-MM-DD vagy null
    active: coupon.active !== false,
    usedCount: idx >= 0 ? (coupons[idx].usedCount || 0) : 0,
    createdAt: idx >= 0 ? coupons[idx].createdAt : new Date().toISOString()
  };
  if (idx >= 0) coupons[idx] = entry; else coupons.push(entry);
  safeSet(STORAGE_KEYS.COUPONS, coupons);
  return entry;
};

export const deleteCoupon = (code) => {
  safeSet(STORAGE_KEYS.COUPONS, getCoupons().filter(c => c.code !== code));
  return true;
};

// ======================== FŐOLDAL TARTALOM (kódolás nélkül szerkeszthető) ========================
// Az admin "Főoldal tartalom" füle innen olvas/ír; a storefront (WorkwearShop.jsx) ezt
// az objektumot olvassa, és minden mezőnél a hardcode-olt alapértékre esik vissza, ha
// az adott kulcs még nincs kitöltve — így egy üres/hiányos KV rekord sosem tör el semmit.
export const getHomepageContent = () => safeGet(STORAGE_KEYS.HOMEPAGE_CONTENT, {});

export const saveHomepageContent = (content) => {
  safeSet(STORAGE_KEYS.HOMEPAGE_CONTENT, content);
  return true;
};

// Közös kupon-ellenőrző logika (kliens és szerver azonosan számol)
export const evaluateCoupon = (coupons, code, productTotal) => {
  const c = (coupons || []).find(x => x.code === (code || '').trim().toUpperCase());
  if (!c) return { valid: false, error: 'Ismeretlen kuponkód' };
  if (c.active === false) return { valid: false, error: 'A kupon már nem aktív' };
  if (c.expiry && c.expiry < new Date().toISOString().split('T')[0]) {
    return { valid: false, error: 'A kupon lejárt' };
  }
  if (c.minOrder && productTotal < c.minOrder) {
    return { valid: false, error: `A kupon ${c.minOrder.toLocaleString('hu-HU')} Ft feletti rendelésre érvényes` };
  }
  const discount = c.type === 'percent'
    ? Math.round(productTotal * c.value / 100)
    : Math.min(Math.round(c.value), productTotal);
  return { valid: true, code: c.code, discount, type: c.type, value: c.value };
};

// Kupon beváltás a checkout-on: Supabase módban szerver-oldali ellenőrzés,
// ha a function nem elérhető (pl. lokális npm start), helyi ellenőrzés
export const validateCoupon = async (code, productTotal) => {
  if (isSupabaseEnabled) {
    try {
      const res = await fetch('/.netlify/functions/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, total: productTotal })
      });
      if (res.ok) return res.json();
    } catch (e) { /* function nem elérhető → helyi fallback */ }
  }
  return evaluateCoupon(getCoupons(), code, productTotal);
};

// ======================== PPC / FORRÁS KÖVETÉS ========================

// Honnan jött a látogató? UTM paraméter az elsődleges (a feedjeink beteszik),
// utána a referrer domain, végül 'direkt'. Munkamenetenként megjegyezzük,
// hogy a belső navigáció is a belépési forráshoz számítson.
const detectTrafficSource = () => {
  try {
    const saved = sessionStorage.getItem('ms_traffic_source');
    if (saved) return saved;
    const utm = new URLSearchParams(window.location.search).get('utm_source') || '';
    let source = null;
    if (/arukereso/i.test(utm)) source = 'arukereso';
    else if (/google/i.test(utm)) source = 'google';
    else if (/facebook|fb/i.test(utm)) source = 'facebook';
    else if (utm) source = 'egyeb';
    else {
      const ref = document.referrer || '';
      if (/arukereso\.hu/i.test(ref)) source = 'arukereso';
      else if (/google\./i.test(ref)) source = 'organikus';
      else if (/facebook\.com|fb\.com/i.test(ref)) source = 'facebook';
      else if (ref && !ref.includes(window.location.host)) source = 'egyeb';
      else source = 'direkt';
    }
    sessionStorage.setItem('ms_traffic_source', source);
    return source;
  } catch (e) {
    return 'direkt';
  }
};

// Termék-megnyitás rögzítése (termékoldal vagy gyorsnézet) — nem blokkoló
export const trackProductOpen = (product, medium = 'oldal') => {
  if (!isSupabaseEnabled || !product) return;
  try {
    fetch('/.netlify/functions/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        articleNo: product.articleNo || '',
        source: detectTrafficSource(),
        medium,
        path: window.location.pathname
      }),
      keepalive: true
    }).catch(() => {});
  } catch (e) { /* statisztika nem blokkolhat semmit */ }
};

// ======================== ÉLŐ AKTIVITÁS ========================

// Termék nézettsége + utolsó rendelés
export const recordProductView = (productId) => {
  const activity = safeGet(STORAGE_KEYS.VIEW_ACTIVITY, {});
  if (!activity[productId]) activity[productId] = { views: [], lastOrder: null };
  activity[productId].views.push(Date.now());
  // Csak az elmúlt 1 óra
  activity[productId].views = activity[productId].views.filter(t => Date.now() - t < 60 * 60 * 1000);
  safeSet(STORAGE_KEYS.VIEW_ACTIVITY, activity);
};

export const getProductActivity = (productId) => {
  const activity = safeGet(STORAGE_KEYS.VIEW_ACTIVITY, {});
  const data = activity[productId] || { views: [], lastOrder: null };
  
  // Aktív (valós) nézők becslése (utolsó 15 percben)
  const recentViews = data.views.filter(t => Date.now() - t < 15 * 60 * 1000);
  
  // Random 1-15 közötti szám + valós néző mennyiség
  const randomViewers = Math.floor(Math.random() * 15) + 1;
  const activeViewers = randomViewers + recentViews.length;
  
  return { activeViewers };
};

// ======================== CSV / XML IMPORT ========================

export const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { error: 'Üres CSV vagy nincs fejléc' };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const required = ['name', 'price', 'categoryId', 'subcategoryId'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length > 0) {
    return { error: `Hiányzó oszlopok: ${missing.join(', ')}` };
  }

  const items = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`${i + 1}. sor: hibás oszlopszám`);
      continue;
    }

    const item = {};
    headers.forEach((h, idx) => {
      let val = values[idx];
      if (h === 'price' || h === 'stock' || h === 'rating') {
        val = parseFloat(val) || 0;
      } else if (h === 'sizes') {
        val = val ? val.split(';').map(s => s.trim()) : [];
      }
      item[h] = val;
    });

    if (!item.image) {
      item.image = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop';
    }
    if (!item.rating) item.rating = 4.5;
    if (!item.stock) item.stock = 0;
    if (!item.description) item.description = '';
    if (!item.sizes) item.sizes = [];

    items.push(item);
  }

  return { items, errors };
};

const parseCSVLine = (line) => {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
};

export const parseXML = (xmlText) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    if (doc.querySelector('parsererror')) {
      return { error: 'Hibás XML formátum' };
    }

    const productNodes = doc.querySelectorAll('product');
    if (productNodes.length === 0) {
      return { error: 'Nincs <product> elem az XML-ben' };
    }

    const items = [];
    const errors = [];

    productNodes.forEach((node, idx) => {
      const getValue = (tag) => {
        const el = node.querySelector(tag);
        return el ? el.textContent.trim() : '';
      };

      const name = getValue('name');
      const price = parseFloat(getValue('price'));
      const categoryId = getValue('categoryId');
      const subcategoryId = getValue('subcategoryId');

      if (!name || !price || !categoryId || !subcategoryId) {
        errors.push(`${idx + 1}. termék: hiányzó kötelező mező`);
        return;
      }

      const sizesText = getValue('sizes');
      const item = {
        name,
        price,
        categoryId,
        subcategoryId,
        description: getValue('description') || '',
        image: getValue('image') || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        stock: parseInt(getValue('stock')) || 0,
        rating: parseFloat(getValue('rating')) || 4.5,
        brand: getValue('brand') || '',
        sizes: sizesText ? sizesText.split(';').map(s => s.trim()) : []
      };
      items.push(item);
    });

    return { items, errors };
  } catch (e) {
    return { error: `XML olvasási hiba: ${e.message}` };
  }
};

// ======================== EXPORT (mentés) ========================

export const exportToCSV = () => {
  const products = getAllProducts();
  const headers = ['id', 'name', 'brand', 'price', 'categoryId', 'subcategoryId', 'description', 'image', 'stock', 'rating', 'sizes', 'hidden', 'sale'];
  const rows = products.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.brand || '',
    p.price,
    p.categoryId,
    p.subcategoryId,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    p.image || '',
    p.stock || 0,
    p.rating || 0,
    (p.sizes || []).join(';'),
    p.hidden ? 'true' : 'false',
    p.sale ? JSON.stringify(p.sale) : ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// Google Shopping XML feed generálás
export const generateGoogleShoppingFeed = (siteUrl = '') => {
  const products = getVisibleProducts().filter(p => p.stock > 0);
  const baseUrl = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  
  const items = products.map(p => {
    const price = (p.sale && p.sale.active) ? p.sale.price : p.price;
    const productUrl = `${baseUrl}/termek/${p.slug || slugify(p.name)}`;
    return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${p.image}</g:image_link>
      <g:availability>${p.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${price}.00 HUF</g:price>
      <g:brand><![CDATA[${p.brand || 'TridentShop'}]]></g:brand>
      <g:condition>new</g:condition>
      <g:product_type><![CDATA[${p.categoryId}]]></g:product_type>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>TridentShop - Google Shopping Feed</title>
    <link>${baseUrl}</link>
    <description>Munkavédelmi termékek webshopja</description>
    ${items}
  </channel>
</rss>`;
};

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  return true;
};
