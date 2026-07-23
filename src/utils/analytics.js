// Analytics helper - Google Analytics 4 + Facebook Pixel
// Setup: .env / Netlify env vars:
//   REACT_APP_GA4_ID = G-XXXXXXXXXX
//   REACT_APP_FB_PIXEL_ID = 1234567890123456

const GA4_ID = process.env.REACT_APP_GA4_ID;
const FB_PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID;

let initialized = false;

// ============ Inicializálás ============
export const initAnalytics = () => {
  if (initialized) return;
  initialized = true;

  // ===== Google Analytics 4 =====
  if (GA4_ID) {
    // gtag.js script betöltése
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    console.log('✅ GA4 betöltve:', GA4_ID);
  }

  // ===== Facebook Pixel =====
  if (FB_PIXEL_ID) {
    // FB Pixel kódrészlet (eredeti FB-tól)
    /* eslint-disable */
    !function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');

    console.log('✅ FB Pixel betöltve:', FB_PIXEL_ID);
  }

  if (!GA4_ID && !FB_PIXEL_ID) {
    console.log('ℹ️ Analytics nincs konfigurálva (állítsd be a REACT_APP_GA4_ID / REACT_APP_FB_PIXEL_ID env vars-okat)');
  }
};

// ============ Page view (route váltáskor) ============
export const trackPageView = (path) => {
  if (window.gtag && GA4_ID) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }
};

// ============ Termék megnézve ============
export const trackViewItem = (product) => {
  if (!product) return;
  const price = (product.sale && product.sale.active) ? product.sale.price : product.price;

  if (window.gtag && GA4_ID) {
    window.gtag('event', 'view_item', {
      currency: 'HUF',
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.categoryId,
        price
      }]
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: price,
      currency: 'HUF'
    });
  }
};

// ============ Kosárba téve ============
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  const price = (product.sale && product.sale.active) ? product.sale.price : product.price;

  if (window.gtag && GA4_ID) {
    window.gtag('event', 'add_to_cart', {
      currency: 'HUF',
      value: price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.categoryId,
        price,
        quantity
      }]
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: price * quantity,
      currency: 'HUF'
    });
  }
};

// ============ Checkout indítva ============
export const trackBeginCheckout = (cart, total) => {
  if (!cart || cart.length === 0) return;

  const items = cart.map(item => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  if (window.gtag && GA4_ID) {
    window.gtag('event', 'begin_checkout', {
      currency: 'HUF',
      value: total,
      items
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: cart.map(i => i.id),
      contents: cart.map(i => ({ id: i.id, quantity: i.quantity })),
      content_type: 'product',
      value: total,
      currency: 'HUF',
      num_items: cart.reduce((s, i) => s + i.quantity, 0)
    });
  }
};

// ============ Sikeres vásárlás ============
export const trackPurchase = (orderId, cart, total) => {
  if (!cart || cart.length === 0) return;

  const items = cart.map(item => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  if (window.gtag && GA4_ID) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'HUF',
      value: total,
      items
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'Purchase', {
      content_ids: cart.map(i => i.id),
      contents: cart.map(i => ({ id: i.id, quantity: i.quantity })),
      content_type: 'product',
      value: total,
      currency: 'HUF',
      num_items: cart.reduce((s, i) => s + i.quantity, 0)
    });
  }
};

// ============ Keresés ============
export const trackSearch = (searchTerm) => {
  if (window.gtag && GA4_ID) {
    window.gtag('event', 'search', { search_term: searchTerm });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'Search', { search_string: searchTerm });
  }
};

// ============ Wishlist-be téve ============
export const trackAddToWishlist = (product) => {
  if (!product) return;
  const price = (product.sale && product.sale.active) ? product.sale.price : product.price;

  if (window.gtag && GA4_ID) {
    window.gtag('event', 'add_to_wishlist', {
      currency: 'HUF',
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price
      }]
    });
  }
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'AddToWishlist', {
      content_ids: [product.id],
      content_name: product.name,
      value: price,
      currency: 'HUF'
    });
  }
};
