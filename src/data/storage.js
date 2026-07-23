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
  COUPONS: 'ms_coupons'
};

// Supabase módban is böngésző-lokális kulcsok (személyes / kozmetikai adatok)
const LOCAL_ONLY_KEYS = [STORAGE_KEYS.WISHLIST, STORAGE_KEYS.VIEW_ACTIVITY];
// Anon kulccsal is olvasható (publikus) kulcsok
const PUBLIC_KEYS = [STORAGE_KEYS.OVERRIDES, STORAGE_KEYS.CUSTOM, STORAGE_KEYS.BLOG_POSTS];

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

export const removeStockFIFO = (productId, quantity, reason = 'Rendelés', colorCode = null) => {
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
      removeStockFIFO(item.id, item.quantity, `Rendelés: ${orderId}`, item.colorCode || null);
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
    author: 'MunkavédelmiShop',
    date: '2024-11-15',
    image: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&h=400&fit=crop',
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
    author: 'MunkavédelmiShop',
    date: '2024-11-22',
    image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=800&h=400&fit=crop',
    tags: ['kesztyu', 'szabvany', 'utmutato']
  },
  {
    id: 3,
    slug: 'jol-lathatosagi-ruha-szabvany',
    title: 'Jól láthatósági ruházat: mikor kötelező?',
    excerpt: 'EN ISO 20471 szabvány a hi-vis munkaruhákról. Mit kell tudni.',
    content: `<h2>Mikor kell hi-vis ruhát viselni?</h2>
<p>Magyar jogszabály szerint kötelező:</p>
<ul>
<li>Útügyi munkáknál (KRESZ)</li>
<li>Vasúti pályán</li>
<li>Repülőtéri pályán</li>
<li>Építőipari helyszíneken, ahol gépjárműforgalom van</li>
</ul>
<h2>Osztályok</h2>
<ul>
<li><strong>1. osztály:</strong> Alacsony láthatóság (mellény) - parkolóhelyen, raktárban</li>
<li><strong>2. osztály:</strong> Közepes láthatóság (mellény + nadrág VAGY kabát) - közúti munka 50 km/h alatt</li>
<li><strong>3. osztály:</strong> Maximális láthatóság (komplett szett vagy egész testet fedő hi-vis) - autópálya, gyorsforgalmi út</li>
</ul>
<h2>Színek</h2>
<p>Fluoreszcens sárga, narancs vagy piros háttér + retroreflektív (visszaverő) csíkok. A reflexcsík minimum 50 mm széles, és mosás után is meg kell őriznie funkcióját.</p>`,
    author: 'MunkavédelmiShop',
    date: '2024-12-01',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=400&fit=crop',
    tags: ['hi-vis', 'jogszabaly', 'kotelezo']
  }
];

export const getBlogPosts = () => {
  let posts = safeGet(STORAGE_KEYS.BLOG_POSTS, null);
  if (!posts) {
    if (isSupabaseEnabled) {
      // Látogató nem írhat az adatbázisba: az alapcikkeket memóriából szolgáljuk ki.
      // Az admin első blog-mentése menti majd őket véglegesen.
      memCache[STORAGE_KEYS.BLOG_POSTS] = defaultBlogPosts;
    } else {
      safeSet(STORAGE_KEYS.BLOG_POSTS, defaultBlogPosts);
    }
    posts = defaultBlogPosts;
  }
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    // New
    const maxId = Math.max(...posts.map(p => p.id), 0);
    posts.push({
      ...post,
      id: maxId + 1,
      slug: slugify(post.title),
      date: post.date || new Date().toISOString().split('T')[0],
      author: post.author || 'MunkavédelmiShop'
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
      <g:brand><![CDATA[${p.brand || 'MunkavédelmiShop'}]]></g:brand>
      <g:condition>new</g:condition>
      <g:product_type><![CDATA[${p.categoryId}]]></g:product_type>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>MunkavédelmiShop - Google Shopping Feed</title>
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
