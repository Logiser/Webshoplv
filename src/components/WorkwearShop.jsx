import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Search, Phone, Mail, MapPin, Truck, Shield, Award, ChevronLeft, ChevronRight, ChevronDown, Home, Filter, Star, Heart, User, Menu, PackageCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productCategories, productSubcategories, getProductImages } from '../data/productData';
import { getVisibleProducts, getAllBrands, getWishlist, toggleWishlist, trackProductOpen, getBlogPosts, getHomepageContent } from '../data/storage';
import { trackAddToCart, trackAddToWishlist } from '../utils/analytics';
import { getSizeChart } from '../data/sizeCharts';
import SizeChartModal from './SizeChartModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useLang } from '../i18n/LanguageContext';

const headerIconBtn = {
  padding: '0.5rem 0.65rem', backgroundColor: 'transparent', border: 'none',
  borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: '0.35rem'
};

const mobileMenuItem = (active) => ({
  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
  padding: '0.85rem 1.25rem', border: 'none', borderBottom: '1px solid #f2f2f2',
  backgroundColor: active ? '#f5f7f5' : 'white', color: active ? '#0F2A1D' : '#333',
  fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left'
});

const headerBadge = {
  position: 'absolute', top: '-4px', right: '-4px',
  backgroundColor: '#d32f2f', color: 'white', borderRadius: '50%',
  width: '18px', height: '18px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.65rem', fontWeight: 'bold'
};

// Magyar színnevek -> hex, a termékkártyák szín-svatch pontjaihoz. Kulcsszó-alapú
// egyezés, hogy a kétszínű nevek ("Fekete/kék", "Kék / navy") is feloldódjanak.
const COLOR_KEYWORDS = [
  ['fekete', '#1a1a1a'], ['fehér', '#f5f5f5'], ['tengerészkék', '#0f2a4a'], ['navy', '#0f2a4a'],
  ['királykék', '#1c4fd6'], ['royal', '#1c4fd6'], ['kék', '#2166d1'], ['piros', '#c62828'],
  ['bordó', '#7a1f2b'], ['mélypiros', '#8e1a24'], ['sárga', '#f4c400'], ['mélysárga', '#e0a800'],
  ['narancssárga', '#e6620a'], ['narancs', '#e6720a'], ['zöld', '#2e7d45'], ['olívazöld', '#5c6b2f'],
  ['oliva', '#5c6b2f'], ['khaki', '#8a7b4f'], ['keki', '#8a7b4f'], ['szürke', '#8a8a8a'],
  ['grafitszürke', '#3a3d40'], ['szénszürke', '#3a3d40'], ['metál szürke', '#7d8286'],
  ['metal szürke', '#7d8286'], ['palaszürke', '#5c6670'], ['zoom szürke', '#8a8a8a'],
  ['barna', '#6b4a30'], ['kávébarna', '#4a3323'], ['cser', '#8a5a2b'], ['bézs', '#d8c6a0'],
  ['homok szín', '#d8c6a0'], ['méz', '#c98a2b'], ['búza', '#d9b76a'], ['lila', '#6a3d9a'],
  ['rózsaszín', '#e895b3'], ['ezüst', '#c0c0c0'], ['króm', '#c8c8c8'], ['türkíz', '#1fb7b3'],
  ['türkiz', '#1fb7b3'], ['égszínkék', '#7ec8e3'], ['halványkék', '#a9d4ee'], ['vízkék', '#8fd0e0'],
  ['kékeszöld', '#2f9e8f'], ['erdőzöld', '#1f5c34'], ['éjszakai erdőzöld', '#173d24'],
  ['üvegzöld', '#3d9970'], ['mohazöld', '#5a6b3a'], ['világos zöld', '#7fc17f'], ['rozsda', '#a04a2a'],
  ['indigó', '#3a4a9e'], ['füst', '#9aa0a6'], ['víztiszta', '#e8f4f8'], ['polarizált', '#333'],
  ['tükrös', '#a8c8d8'], ['tükröződő', '#a8c8d8']
];

const resolveColorHexes = (colorName) => {
  const norm = (colorName || '').toLowerCase();
  const parts = norm.split(/\s*\/\s*/).filter(Boolean);
  const hexes = [];
  parts.forEach(part => {
    const hit = COLOR_KEYWORDS.find(([kw]) => part.includes(kw));
    if (hit && !hexes.includes(hit[1])) hexes.push(hit[1]);
  });
  if (hexes.length === 0) {
    const hit = COLOR_KEYWORDS.find(([kw]) => norm.includes(kw));
    if (hit) hexes.push(hit[1]);
  }
  return hexes.slice(0, 2);
};

// Iparági szűrő: a már meglévő, pontosan címkézett alkategóriákból építve
// (nem találgatás — ezek a termékadatban tényleges subcategoryId-k).
const INDUSTRY_BY_SUBCATEGORY = {
  'elelmiszeripari': 'Élelmiszeripar',
  'esd-ruhazat': 'ESD & elektronika',
  'hutohazi': 'Hűtőházi & hidegtárolás',
  'ipari-vedoruha': 'Ipari védelem',
  'langallo': 'Hegesztés & tűzvédelem',
  'sef-ruhazat': 'Vendéglátás & séf',
  'magasban-munka': 'Magasban végzett munka',
  'zuhanasgatlo-kieg': 'Magasban végzett munka',
  'lathatosagi': 'Építőipar & közúti munka'
};
const getIndustry = (product) => INDUSTRY_BY_SUBCATEGORY[product.subcategoryId] || null;

// EN-szabványkódok kiolvasása a termékleírásból (pl. "EN ISO 20471", "EN388:2016" -> "EN 388").
// Nem minden terméknél szerepel — csak ott jelenik meg szűrhető szabványként, ahol tényleg van.
const STANDARD_RE = /EN\s?(ISO\s?)?\d{2,6}(-\d+)?/g;
const extractStandards = (product) => {
  const text = product.description || '';
  const found = new Set();
  let m;
  STANDARD_RE.lastIndex = 0;
  while ((m = STANDARD_RE.exec(text))) {
    const norm = m[0].replace(/\s+/g, ' ').replace(/^EN\s?(ISO)?/i, (full, iso) => iso ? 'EN ISO ' : 'EN ').trim();
    found.add(norm);
  }
  return [...found];
};

// Valódi "1+1" akció: kis értékű, fogyóeszköz-jellegű termékek (egy méret/szín), ahol
// a 2. darab ténylegesen ingyenes — nem csak dekoratív felirat, a kosár/pénztár/számla is ekként számol.
// Alapérték kódban; admin a "Főoldal tartalom" fülön felülírhatja (ld. applyHomepageContentOverrides).
let BUNDLE_1PLUS1_IDS = [1873, 1541, 1505, 1501, 211, 1524];
// Admin-felülírás alkalmazása a modulszintű konstansra — a helper függvények (isBundleProduct,
// chargeableQty stb.) mindig a friss értéket olvassák, mert a tömb referenciáját cseréljük, nem
// másolatot készítünk belőle.
const applyHomepageContentOverrides = (content) => {
  if (content && Array.isArray(content.bundleProductIds) && content.bundleProductIds.length > 0) {
    BUNDLE_1PLUS1_IDS = content.bundleProductIds;
  }
};
const isBundleProduct = (id) => BUNDLE_1PLUS1_IDS.includes(id);
// Fizetendő darabszám 1+1 akciós tételre: minden 2. darab ingyenes.
const chargeableQty = (item) => isBundleProduct(item.id) ? Math.ceil(item.quantity / 2) : item.quantity;
// A kosarat pénztárra/számlázásra bontja: 1+1 tételnél külön, 0 Ft-os "ajándék" sort kap a kedvezmény,
// így a szerver (place-order.js) semmilyen módosítás nélkül, a meglévő price×quantity logikájával is helyesen számláz.
const expandBundleCart = (cart) => cart.flatMap(item => {
  if (!isBundleProduct(item.id) || item.quantity < 2) return [item];
  const freeQty = Math.floor(item.quantity / 2);
  const paidQty = item.quantity - freeQty;
  return [
    { ...item, quantity: paidQty },
    { ...item, quantity: freeQty, price: 0, name: `${item.name} (1+1 ajándék)` }
  ];
});

const WorkwearShop = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  // Admin által kódolás nélkül szerkeszthető főoldal-tartalom (ld. AdminPanel "Főoldal tartalom" fül)
  const [homepageContent] = useState(() => {
    const c = getHomepageContent();
    applyHomepageContentOverrides(c);
    return c;
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  // Mobil nézet: egyoszlopos elrendezés + nyitható szűrőpanel
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [openMegaMenu, setOpenMegaMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const megaMenuCloseTimer = useRef(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sortBy, setSortBy] = useState('default');
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlistState] = useState([]);


  // Filters
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(50000);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [minRating, setMinRating] = useState(0);
  // Lapozás: ~2000 termékkártya egyszerre berenderelése lassú lenne
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const allProducts = getVisibleProducts();
    setProducts(allProducts);
    setWishlistState(getWishlist());

    // Max ár-tartomány beállítása
    if (allProducts.length > 0) {
      const maxP = Math.max(...allProducts.map(p => p.price));
      setPriceMax(Math.ceil(maxP / 1000) * 1000);
    }

    // Temp cart visszatöltése (ProductDetailPage-ről)
    const tempCart = sessionStorage.getItem('temp_cart');
    if (tempCart) {
      try {
        const items = JSON.parse(tempCart);
        if (items.length > 0) {
          setCart(prev => [...prev, ...items]);
          sessionStorage.removeItem('temp_cart');
        }
      } catch (e) {}
    }

    // Kosár visszaállítása az emlékeztető e-mail linkjéből (?kosar=<token>)
    const params = new URLSearchParams(window.location.search);
    const restoreToken = params.get('kosar');
    if (restoreToken) {
      fetch(`/.netlify/functions/restore-cart?t=${encodeURIComponent(restoreToken)}`)
        .then(r => r.json())
        .then(d => {
          if (d && Array.isArray(d.cart) && d.cart.length > 0) {
            setCart(d.cart);
            setCartOpen(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          // A token ne maradjon a címsorban
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, []);

  const getEffectivePrice = (p) => (p.sale && p.sale.active) ? p.sale.price : p.price;

  // SEO
  useEffect(() => {
    document.title = 'TridentShop - Munkaruházat és Munkavédelmi Felszerelés Webshop';

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setMeta('description', 'Munkavédelmi ruházat, biztonsági cipők, bakancsok, kesztyűk és védőfelszerelés webshopja. 75+ termék, gyors kiszállítás, kedvező árak.');
    setMeta('keywords', 'munkaruha, munkavédelmi ruházat, munkavédelmi cipő, bakancs, kesztyű, sisak, munkaruházat webshop');
    setMeta('robots', 'index, follow');
    setMeta('og:title', 'TridentShop - Munkaruházat Webshop', true);
    setMeta('og:type', 'website', true);
    setMeta('og:locale', 'hu_HU', true);
  }, []);

  const allBrands = getAllBrands();

  // Méretszűrő: csak az aktuális kategória/alkategória termékeiben előforduló
  // méretek jelenjenek meg (ne keveredjen a cipőméret a ruhamérettel)
  const sizeSourceProducts = products.filter(p =>
    (!selectedCategory || p.categoryId === selectedCategory) &&
    (!selectedSubcategory || p.subcategoryId === selectedSubcategory)
  );
  const sizeOrder = (s) => {
    const num = parseInt(s);
    if (!isNaN(num)) return num;                                        // számos méretek (36-52)
    const order = ['2XS', 'XS', 'XS/S', 'S', 'S/M', 'M', 'M/L', 'L', 'L/XL', 'XL', 'XL/XXL', '2XL', '2XL/3XL', 'XXL', '3XL', '4XL', '4XL/5XL', '5XL', '6XL', 'Egységes'];
    const idx = order.indexOf(s);
    return idx >= 0 ? 100 + idx : 200;                                  // betűs méretek a számok után
  };
  const allSizes = Array.from(new Set(sizeSourceProducts.flatMap(p => p.sizes || [])))
    .sort((a, b) => sizeOrder(a) - sizeOrder(b) || String(a).localeCompare(String(b)));

  // Szabvány-szűrő: csak az aktuális kategória/alkategória termékeiben előforduló EN-kódok
  const allStandards = Array.from(new Set(sizeSourceProducts.flatMap(p => extractStandards(p)))).sort();

  // Iparági szűrő: csak az aktuális kategória/alkategória termékeiben előforduló iparágak
  const allIndustries = Array.from(new Set(sizeSourceProducts.map(getIndustry).filter(Boolean))).sort();

  // Kategóriaváltáskor a már nem elérhető kijelölt méretek/szabványok/iparágak törlése
  useEffect(() => {
    setSelectedSizes(prev => prev.filter(s => allSizes.includes(s)));
    setSelectedStandards(prev => prev.filter(s => allStandards.includes(s)));
    setSelectedIndustries(prev => prev.filter(s => allIndustries.includes(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory]);

  // Szűrő- vagy rendezés-váltáskor a lapozás visszaáll az elejére
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, selectedCategory, selectedSubcategory, priceMin, priceMax, selectedBrands, selectedSizes, selectedStandards, selectedIndustries, minRating, sortBy]);

  // Szűrt termékek
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || p.subcategoryId === selectedSubcategory;
    const price = (p.sale && p.sale.active ? p.sale.price : p.price);
    const matchesPrice = price >= priceMin && price <= priceMax;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
    const matchesSize = selectedSizes.length === 0 || (p.sizes || []).some(s => selectedSizes.includes(s));
    const matchesStandard = selectedStandards.length === 0 || extractStandards(p).some(s => selectedStandards.includes(s));
    const matchesIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(getIndustry(p));
    const matchesRating = (p.rating || 0) >= minRating;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice && matchesBrand && matchesSize && matchesStandard && matchesIndustry && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return getEffectivePrice(a) - getEffectivePrice(b);
    if (sortBy === 'price-desc') return getEffectivePrice(b) - getEffectivePrice(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    // Alapértelmezett rendezés: a "Nincs raktáron" termékek mindig leghátul;
    // a raktáron lévők közül előre a népszerű (jobban értékelt), több szín-
    // és mérerválasztékkal rendelkező termékek kerülnek.
    const outOfStockDiff = (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1);
    if (outOfStockDiff !== 0) return outOfStockDiff;
    const richness = (p) => ((p.variants || []).length > 1 ? 1 : 0) + ((p.sizes || []).length > 1 ? 1 : 0);
    const richnessDiff = richness(b) - richness(a);
    if (richnessDiff !== 0) return richnessDiff;
    return (b.rating || 0) - (a.rating || 0);
  });

  const addToCart = (product) => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Kérjük, válassz méretet!');
      return;
    }
    // Szín variáns: több színnél kötelező választani, egy színnél automatikus
    const variants = product.variants || [];
    let variant = null;
    if (variants.length === 1) {
      variant = variants[0];
    } else if (variants.length > 1) {
      variant = variants.find(v => v.code === selectedColor);
      if (!variant) {
        alert('Kérjük, válassz színt!');
        return;
      }
    }
    // Méret-szintű készlet ellenőrzése (szín×méret mátrix)
    if (variant && variant.sizeStock && selectedSize) {
      const avail = variant.sizeStock[selectedSize] || 0;
      if (avail < quantity) {
        alert(avail === 0
          ? `A(z) ${variant.color} színből ${selectedSize} méretben elfogyott!`
          : `A(z) ${variant.color} / ${selectedSize} méretből csak ${avail} db van raktáron!`);
        return;
      }
    }
    const effectivePrice = getEffectivePrice(product);
    const cartItem = {
      id: product.id, name: product.name, price: effectivePrice,
      quantity, size: selectedSize, image: (variant && variant.image) || product.image,
      color: variant ? variant.color : null, colorCode: variant ? variant.code : null,
      variantStock: variant ? variant.stock : null,
      sizeStockAtAdd: (variant && variant.sizeStock && selectedSize) ? (variant.sizeStock[selectedSize] || 0) : null
    };
    const existingItem = cart.find(item => item.id === product.id && item.size === selectedSize && item.colorCode === cartItem.colorCode);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id && item.size === selectedSize && item.colorCode === cartItem.colorCode
          ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      setCart([...cart, cartItem]);
    }
    setSelectedProduct(null);
    setSelectedSize(null);
    setQuantity(1);
    trackAddToCart(product, quantity);  // GA4 + FB Pixel
  };

  const removeFromCart = (id, size, colorCode = null) => {
    setCart(cart.filter(item => !(item.id === id && item.size === size && item.colorCode === colorCode)));
  };

  // Gyors "1+1" kosárba tétel a főoldali promó-blokkból: a kurált termékek egyetlen
  // szín/méret-variánsban léteznek, ezért a méret/szín-választó modál nélkül, 2 db-bal adjuk kosárba.
  const addBundleToCart = (product) => {
    const variant = (product.variants || [])[0] || null;
    const effectivePrice = getEffectivePrice(product);
    const existingItem = cart.find(item => item.id === product.id && item.size === null && item.colorCode === (variant ? variant.code : null));
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id && item.size === null && item.colorCode === (variant ? variant.code : null)
          ? { ...item, quantity: item.quantity + 2 } : item
      ));
    } else {
      setCart([...cart, {
        id: product.id, name: product.name, price: effectivePrice,
        quantity: 2, size: null, image: (variant && variant.image) || product.image,
        color: variant ? variant.color : null, colorCode: variant ? variant.code : null,
        variantStock: variant ? variant.stock : null, sizeStockAtAdd: null
      }]);
    }
    trackAddToCart(product, 2);
    setCartOpen(true);
  };

  const handleWishlist = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = wishlist.includes(productId);
    toggleWishlist(productId);
    if (!wasInWishlist) {
      const p = products.find(pr => pr.id === productId);
      if (p) trackAddToWishlist(p);  // GA4 + FB Pixel
    }
    setWishlistState(getWishlist());
  };

  const subscribeNewsletter = async (source) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newsletterEmail)) { alert('Kérlek, érvényes email-címet adj meg.'); return; }
    try {
      await fetch('/.netlify/functions/newsletter-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'subscribe', email: newsletterEmail, source })
      });
    } catch (e) { /* offline dev: nem blokkolunk */ }
    setNewsletterDone(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * chargeableQty(item)), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentSubcategories = selectedCategory 
    ? productSubcategories.filter(sub => sub.categoryId === selectedCategory)
    : [];

  const toggleArrayItem = (arr, setter, item) => {
    if (arr.includes(item)) {
      setter(arr.filter(x => x !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const resetFilters = () => {
    setPriceMin(0);
    const maxP = Math.max(...products.map(p => p.price), 50000);
    setPriceMax(Math.ceil(maxP / 1000) * 1000);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedStandards([]);
    setSelectedIndustries([]);
    setMinRating(0);
  };

  // Aktív szűrők chip-sora — mindig levehető, egyenkénti X gombbal
  const defaultMaxPrice = Math.ceil(Math.max(...products.map(p => p.price), 50000) / 1000) * 1000;
  const activeChips = [
    ...(selectedSubcategory ? [{ key: 'sub', label: productSubcategories.find(s => s.id === selectedSubcategory)?.name, onRemove: () => setSelectedSubcategory(null) }] : []),
    ...((priceMin > 0 || priceMax < defaultMaxPrice) ? [{ key: 'price', label: `${priceMin.toLocaleString('hu-HU')}–${priceMax.toLocaleString('hu-HU')} Ft`, onRemove: () => { setPriceMin(0); setPriceMax(defaultMaxPrice); } }] : []),
    ...selectedBrands.map(b => ({ key: `brand-${b}`, label: b, onRemove: () => toggleArrayItem(selectedBrands, setSelectedBrands, b) })),
    ...selectedSizes.map(s => ({ key: `size-${s}`, label: `Méret: ${s}`, onRemove: () => toggleArrayItem(selectedSizes, setSelectedSizes, s) })),
    ...selectedStandards.map(s => ({ key: `std-${s}`, label: s, onRemove: () => toggleArrayItem(selectedStandards, setSelectedStandards, s) })),
    ...selectedIndustries.map(i => ({ key: `ind-${i}`, label: i, onRemove: () => toggleArrayItem(selectedIndustries, setSelectedIndustries, i) })),
    ...(minRating > 0 ? [{ key: 'rating', label: `${minRating}+ ⭐`, onRemove: () => setMinRating(0) }] : [])
  ];

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Egyetlen globális keyframe a futó ticker-szalaghoz (inline style-lal nem megy) */}
      <style>{'@keyframes tsTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }'}</style>

      {/* Top Info Bar */}
      <div style={{
        backgroundColor: '#0a1f19', color: 'white', padding: '0.9rem 1.5rem', fontSize: '0.9rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Phone size={14} /> {homepageContent.topBarPhone || '+36 30 272 2571'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Mail size={14} /> {homepageContent.topBarEmail || 'iroda@tuz-munkavedelmiszaki.hu'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Truck size={14} /> {t('nav.freeShipping')}
          </span>
          <LanguageSwitcher compact />
        </div>
      </div>

      {/* Header */}
      <header style={{
        backgroundColor: 'white', padding: '0.85rem 1.5rem',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderBottom: '1px solid #eee'
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap'
        }}>
          <button onClick={() => setMobileMenuOpen(o => !o)} aria-label="Menü" style={{
            display: isMobile ? 'flex' : 'none', background: 'none', border: 'none',
            color: '#0F2A1D', cursor: 'pointer', padding: '0.25rem'
          }}>
            <Menu size={26} />
          </button>

          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Georgia, serif', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                display: 'inline-flex', width: '2.1rem', height: '2.1rem', borderRadius: '8px',
                backgroundColor: '#0F2A1D', color: '#C9A961', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>🛡️</span>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>TridentShop</span>
            </h1>
          </Link>

          <div style={{
            flex: 1, minWidth: '180px', maxWidth: '560px', position: 'relative',
            display: 'flex', alignItems: 'center', backgroundColor: '#f5f6f5',
            borderRadius: '999px', padding: '0.15rem 0.15rem 0.15rem 1rem', border: '1.5px solid #e5e5e0'
          }}>
            <input
              type="text" placeholder={t("nav.search")}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
              onFocus={() => setSearchFocus(true)}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '0.55rem 0', fontSize: '0.95rem', outline: 'none', minWidth: 0 }}
            />
            <button aria-label="Keresés" style={{
              backgroundColor: '#0F2A1D', border: 'none', borderRadius: '999px', width: '2.3rem', height: '2.3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#C9A961'
            }}>
              <Search size={17} />
            </button>
            {/* Kereső-előnézet: cikkszám-egyezés előre, aztán név-találatok */}
            {searchFocus && searchTerm.trim().length >= 2 && (() => {
              const q = searchTerm.trim().toLowerCase();
              const byArt = products.filter(p => (p.articleNo || '').toLowerCase().startsWith(q));
              const byName = products.filter(p => !byArt.includes(p) && p.name.toLowerCase().includes(q));
              const hits = [...byArt, ...byName].slice(0, 6);
              if (hits.length === 0) return null;
              return (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 60,
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.14)', overflow: 'hidden'
                }}>
                  {hits.map(p => (
                    <Link key={p.id} to={`/termek/${p.slug}`} onClick={() => { setSearchFocus(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', textDecoration: 'none', borderBottom: '1px solid #f2f2f2' }}>
                      <img src={p.image} alt="" loading="lazy" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#fafafa', borderRadius: '4px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#0F2A1D', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ color: '#999', fontSize: '0.72rem' }}>{p.articleNo}</div>
                      </div>
                      <div style={{ color: '#C9A961', fontWeight: 'bold', fontSize: '0.88rem', flexShrink: 0 }}>
                        {(p.sale && p.sale.active ? p.sale.price : p.price).toLocaleString('hu-HU')} Ft
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link to="/fiok" title={t('account.title')} style={headerIconBtn}>
              <User size={21} color="#0F2A1D" />
              {!isMobile && <span style={{ fontSize: '0.78rem', color: '#0F2A1D', fontWeight: 600 }}>{t('account.title')}</span>}
            </Link>

            <Link to="/wishlist" title={t("nav.favorites")} style={{ ...headerIconBtn, position: 'relative' }}>
              <Heart size={21} fill={wishlist.length > 0 ? '#d32f2f' : 'none'} color="#d32f2f" />
              {wishlist.length > 0 && (
                <span style={headerBadge}>{wishlist.length}</span>
              )}
            </Link>

            <button onClick={() => setCartOpen(!cartOpen)} style={{
              backgroundColor: '#0F2A1D', color: 'white',
              padding: '0.6rem 1.1rem', borderRadius: '999px', border: 'none',
              cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '0.55rem', position: 'relative'
            }}>
              <ShoppingCart size={19} color="#C9A961" />
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 400 }}>{t('nav.cart')}</span>
                <span style={{ fontSize: '0.92rem' }}>{cartTotal.toLocaleString('hu-HU')} Ft</span>
              </span>
              {cartCount > 0 && (
                <span style={{ ...headerBadge, top: '-8px', right: '-8px', backgroundColor: '#C9A961', color: '#0F2A1D' }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Futó ticker-szalag (Liquid Death minta) — arany sáv, végtelenített nagybetűs üzenetekkel */}
      {!selectedCategory && !searchTerm && (() => {
        const tickerItems = [
          '100% EREDETI PORTWEST', 'INGYENES SZÁLLÍTÁS 30 000 FT FELETT',
          'CE-TANÚSÍTOTT TERMÉKEK', '2-3 MUNKANAPOS KISZÁLLÍTÁS',
          '1+1 AJÁNLATOK', '14 NAPOS CSERE ÉS VISSZAKÜLDÉS'
        ];
        const half = tickerItems.map((x, i) => <span key={i} style={{ margin: '0 1.75rem' }}>{x} ◆</span>);
        return (
          <div style={{ backgroundColor: '#C9A961', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0.5rem 0' }}>
            <div style={{
              display: 'inline-block', animation: 'tsTicker 30s linear infinite',
              color: '#0F2A1D', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em'
            }}>
              {half}{tickerItems.map((x, i) => <span key={`b${i}`} style={{ margin: '0 1.75rem' }}>{x} ◆</span>)}
            </div>
          </div>
        );
      })()}

      {/* Category Navigation (mega-menü) — asztali nézet; a főoldalon a bal oldali kategória-sáv veszi át a szerepét */}
      {!isMobile && (selectedCategory || searchTerm) && (
        <nav style={{
          backgroundColor: '#0F2A1D', padding: '0 1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative', zIndex: 90
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'stretch', flexWrap: 'nowrap' }}>
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              style={{
                padding: '0.75rem 1rem', border: 'none',
                backgroundColor: selectedCategory === null ? '#C9A961' : 'transparent',
                color: selectedCategory === null ? '#0F2A1D' : 'white',
                cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', fontSize: '0.9rem'
              }}
            >
              <Home size={15} /> {t('nav.all')}
            </button>
            {productCategories.map(category => {
              const subs = productSubcategories.filter(s => s.categoryId === category.id);
              const isOpen = openMegaMenu === category.id;
              return (
                <div key={category.id}
                  onMouseEnter={() => { clearTimeout(megaMenuCloseTimer.current); setOpenMegaMenu(category.id); }}
                  onMouseLeave={() => { megaMenuCloseTimer.current = setTimeout(() => setOpenMegaMenu(null), 150); }}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={() => { setSelectedCategory(category.id); setSelectedSubcategory(null); setOpenMegaMenu(null); }}
                    style={{
                      padding: '0.75rem 1rem', border: 'none',
                      backgroundColor: selectedCategory === category.id ? '#C9A961' : 'transparent',
                      color: selectedCategory === category.id ? '#0F2A1D' : 'white',
                      cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    {category.icon} {category.name}
                    {subs.length > 0 && <ChevronDown size={13} style={{ opacity: 0.7 }} />}
                  </button>

                  {isOpen && subs.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, minWidth: '260px', zIndex: 95,
                      backgroundColor: 'white', borderRadius: '0 0 10px 10px', boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
                      padding: '0.5rem', display: 'grid', gap: '0.15rem'
                    }}>
                      <Link to="#" onClick={(e) => { e.preventDefault(); setSelectedCategory(category.id); setSelectedSubcategory(null); setOpenMegaMenu(null); window.scrollTo({ top: 0 }); }}
                        style={{ padding: '0.5rem 0.75rem', color: '#0F2A1D', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', borderRadius: '6px', borderBottom: '1px solid #f0f0f0', marginBottom: '0.2rem' }}>
                        Összes {category.name.toLowerCase()} →
                      </Link>
                      {subs.map(sub => (
                        <Link key={sub.id} to="#"
                          onClick={(e) => { e.preventDefault(); setSelectedCategory(category.id); setSelectedSubcategory(sub.id); setOpenMegaMenu(null); window.scrollTo({ top: 0 }); }}
                          style={{ padding: '0.45rem 0.75rem', color: '#333', textDecoration: 'none', fontSize: '0.87rem', borderRadius: '6px' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f7f5'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Link to="/blog" style={{
              padding: '0.75rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'bold',
              marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: '0.9rem'
            }}>📝 {t('nav.blog')}</Link>
          </div>
        </nav>
      )}

      {/* Mobil menü-fiók */}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 199 }} />
          <div style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: '82%', maxWidth: '320px',
            backgroundColor: 'white', zIndex: 200, overflowY: 'auto', boxShadow: '4px 0 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ backgroundColor: '#0F2A1D', color: 'white', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'white' }}>
                <strong style={{ fontFamily: 'Georgia, serif' }}>🛡️ TridentShop</strong>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setMobileMenuOpen(false); }} style={mobileMenuItem(selectedCategory === null)}>
              <Home size={16} /> {t('nav.all')}
            </button>
            {productCategories.map(cat => (
              <div key={cat.id}>
                <button onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }}
                  style={mobileMenuItem(selectedCategory === cat.id)}>
                  {cat.icon} {cat.name}
                </button>
              </div>
            ))}
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} style={{ ...mobileMenuItem(false), textDecoration: 'none' }}>📝 {t('nav.blog')}</Link>
            <Link to="/fiok" onClick={() => setMobileMenuOpen(false)} style={{ ...mobileMenuItem(false), textDecoration: 'none' }}><User size={16} /> {t('account.title')}</Link>
            <Link to="/rendeles-kovetes" onClick={() => setMobileMenuOpen(false)} style={{ ...mobileMenuItem(false), textDecoration: 'none' }}><PackageCheck size={16} /> {t('footer.tracking')}</Link>
          </div>
        </>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, width: '100%', maxWidth: '450px',
            height: '100vh', backgroundColor: 'white',
            boxShadow: '-2px 0 16px rgba(0,0,0,0.2)', zIndex: 201,
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#0F2A1D', padding: '1.1rem 1.5rem', marginBottom: '1.5rem',
              position: 'sticky', top: 0, zIndex: 2
            }}>
              <h2 style={{
                color: 'white', margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.3rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em'
              }}>
                Kosár
              </h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                <ShoppingCart size={64} style={{ color: '#ddd', marginBottom: '1rem' }} />
                <p>A kosár üres.</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={`${item.id}-${item.size}-${item.colorCode || ''}`} style={{
                    borderBottom: '1px solid #eee', paddingBottom: '1rem',
                    marginBottom: '1rem', display: 'flex', gap: '0.75rem'
                  }}>
                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</p>
                      {(item.size || item.color) && <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#666' }}>
                        {item.size && <>Méret: <strong>{item.size}</strong></>}{item.size && item.color && ' · '}{item.color && <>Szín: <strong>{item.color}</strong></>}
                      </p>}
                      {isBundleProduct(item.id) && (
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.72rem', fontWeight: 'bold', color: '#2e7d32' }}>
                          🎁 1+1 Akció — minden 2. darab ingyenes
                        </p>
                      )}
                      <p style={{ margin: 0, color: '#0F2A1D', fontWeight: 'bold' }}>
                        {item.quantity} × {item.price.toLocaleString('hu-HU')} Ft
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#C9A961', fontWeight: 'bold' }}>
                        = {(chargeableQty(item) * item.price).toLocaleString('hu-HU')} Ft
                        {chargeableQty(item) < item.quantity && (
                          <span style={{ color: '#2e7d32', fontWeight: 'normal', fontSize: '0.78rem' }}> ({item.quantity - chargeableQty(item)} db ingyen)</span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(item.id, item.size, item.colorCode)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', alignSelf: 'flex-start' }}>
                      <X size={18} />
                    </button>
                  </div>
                ))}

                <div style={{ backgroundColor: '#0F2A1D', color: 'white', padding: '1.25rem', borderRadius: '4px', marginTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Részösszeg:</span>
                      <span>{cartTotal.toLocaleString('hu-HU')} Ft</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Szállítás:</span>
                      <span style={{ color: cartTotal >= 30000 ? '#4CAF50' : '#C9A961' }}>
                        {cartTotal >= 30000 ? 'INGYENES' : '+1.290 Ft'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Összesen:</span>
                    <span style={{ color: '#C9A961' }}>
                      {(cartTotal + (cartTotal >= 30000 ? 0 : 1290)).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/checkout', { state: { cart: expandBundleCart(cart), total: cartTotal + (cartTotal >= 30000 ? 0 : 1290) } });
                      setCartOpen(false);
                    }}
                    style={{
                      width: '100%', backgroundColor: '#C9A961', color: '#0F2A1D',
                      padding: '0.875rem', borderRadius: '4px', border: 'none',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    Rendelés Lezárása <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </>
      )}

      {/* Hero — teljes szélességű, bátor tipográfiai sáv (Liquid Death), utána egy sor
          kerek kategória-ikon (Uniqlo "Search by category" mintája) — nincs többé
          állandó bal oldali kategória-sáv. */}
      {!selectedCategory && !searchTerm && (
        <div style={{ backgroundColor: '#f5f5f5', padding: isMobile ? '1.25rem 1.5rem' : '1.5rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <HeroCarousel
              t={t} productCount={products.length} isMobile={isMobile}
              bestSaleProduct={products.filter(p => p.sale && p.sale.active && p.sale.price < p.price)
                .sort((a, b) => (b.price - b.sale.price) / b.price - (a.price - a.sale.price) / a.price)[0] || null}
              content={homepageContent}
            />
          </div>
        </div>
      )}

      {/* Akciós ajánlatok sáv — az 1. és 2. hely mindig a két legjobb akció, a 3. hely egy 1+1 ajánlat */}
      {!selectedCategory && !searchTerm && (() => {
        const saleItems = products.filter(p => p.sale && p.sale.active && p.sale.price < p.price)
          .sort((a, b) => (b.price - b.sale.price) / b.price - (a.price - a.sale.price) / a.price)
          .slice(0, 10);
        if (saleItems.length === 0) return null;
        const bundleProduct = BUNDLE_1PLUS1_IDS.map(id => products.find(p => p.id === id)).find(p => p && p.stock > 1);
        const items = [...saleItems];
        if (bundleProduct) items.splice(2, 0, { ...bundleProduct, isBundleSlot: true });
        return <SaleCarouselRow items={items} />;
      })()}

      {/* Bátor állítás-sáv (Liquid Death "misszió" minta): nagy, kövér claim + ferde
          vágású arany csík — ugyanaz a diagonál-motívum, mint a heróban */}
      {!selectedCategory && !searchTerm && (
        <div style={{ position: 'relative', backgroundColor: '#0F2A1D', padding: isMobile ? '3.5rem 1.5rem' : '5rem 1.5rem', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '14px',
            backgroundColor: '#C9A961', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 40%)'
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '14px',
            backgroundColor: '#C9A961', clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)'
          }} />
          <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            {/* whiteSpace nowrap + vw-alapú betűméret: mindig EGY sorban marad, kis képernyőn is */}
            <h3 style={{
              fontFamily: 'Georgia, serif', fontSize: 'clamp(1.4rem, 4.2vw, 3.2rem)', color: 'white',
              margin: '0 0 1rem 0', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.01em', whiteSpace: 'nowrap'
            }}>
              A HAMISÍTVÁNY NEM VÉD.
            </h3>
            <p style={{ color: '#C9A961', fontSize: '1.15rem', fontWeight: 700, margin: 0, letterSpacing: '0.03em' }}>
              NÁLUNK NINCS UTÁNZAT — EREDETI, CE-TANÚSÍTVÁNNYAL RENDELKEZŐ TERMÉKEK.
            </p>
          </div>
        </div>
      )}

      {/* Kategória-ikonok — Uniqlo "Search by category" mintája, Liquid Death-es kontraszttal:
          arany gyűrűs kör-ikonok, nagybetűs, kövér feliratok — fehér alapon (a sötétzöld
          sávok a hero és a misszió-sáv körül maradnak, hogy megmaradjon a ritmus) */}
      {!selectedCategory && !searchTerm && (
        <div id="kategoriak" style={{ backgroundColor: 'white', padding: isMobile ? '2rem 1.5rem' : '3rem 1.5rem' }}>
          <div style={{
            maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: isMobile ? '1.5rem' : '3rem',
            justifyContent: 'center', flexWrap: 'wrap', overflowX: 'auto'
          }}>
            {[
              { key: 'kabatok', label: 'Kabátok', cat: 'munkaruha', sub: 'kabatok' },
              { key: 'polok', label: 'Pólók', cat: 'munkaruha', sub: 'felsok' },
              { key: 'nadragok', label: 'Nadrágok', cat: 'munkaruha', sub: 'nadragok' },
              { key: 'cipok', label: 'Munkavédelmi Cipők', cat: 'munkacipo', sub: null },
              { key: 'bakancsok', label: 'Munkavédelmi Bakancsok', cat: 'bakancs', sub: null },
              { key: 'kesztyuk', label: 'Munkavédelmi Kesztyűk', cat: 'kesztyu', sub: null },
              { key: 'vedoeszkozok', label: 'Védőeszközök', cat: 'kiegeszitok', sub: null },
              { key: 'egyebek', label: 'Egyebek', cat: 'munkaruha', sub: null }
            ].map(entry => {
              const rep = products.find(p => p.image && (entry.sub
                ? p.subcategoryId === entry.sub
                : (entry.key === 'egyebek'
                    ? (p.categoryId === 'munkaruha' && !['kabatok', 'felsok', 'nadragok'].includes(p.subcategoryId))
                    : p.categoryId === entry.cat)));
              return (
                <button key={entry.key} onClick={() => { setSelectedCategory(entry.cat); setSelectedSubcategory(entry.sub); window.scrollTo({ top: 0 }); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: '0.85rem', flexShrink: 0, width: '108px'
                }}>
                  <div style={{
                    width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#f9f9f9',
                    border: '3px solid #C9A961', position: 'relative', overflow: 'hidden'
                  }}>
                    {rep && (
                      <img src={rep.image} alt="" loading="lazy" style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '0.85rem'
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.8rem', color: '#0F2A1D', fontWeight: 700, textAlign: 'center', lineHeight: 1.25,
                    textTransform: 'uppercase', letterSpacing: '0.02em'
                  }}>
                    {entry.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      {(selectedCategory || searchTerm) && (
        <div style={{ backgroundColor: 'white', padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#666', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>Főoldal</Link>
            {selectedCategory && (
              <>
                <ChevronRight size={14} />
                <span style={{ color: '#0F2A1D', fontWeight: 'bold' }}>
                  {productCategories.find(c => c.id === selectedCategory)?.name}
                </span>
              </>
            )}
            {selectedSubcategory && (
              <>
                <ChevronRight size={14} />
                <span style={{ color: '#C9A961', fontWeight: 'bold' }}>
                  {productSubcategories.find(s => s.id === selectedSubcategory)?.name}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Sidebar + Products */}
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {/* Mobil szűrő-kapcsoló */}
        {isMobile && (
          <button onClick={() => setFiltersOpen(o => !o)} style={{
            width: '100%', marginBottom: '1rem', padding: '0.75rem',
            backgroundColor: filtersOpen ? '#0F2A1D' : 'white', color: filtersOpen ? 'white' : '#0F2A1D',
            border: '1px solid #0F2A1D', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <Filter size={16} /> Szűrők {filtersOpen ? 'elrejtése' : 'megjelenítése'}
          </button>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
          gap: isMobile ? '1rem' : '2rem'
        }}>

          {/* Sidebar with Filters */}
          <aside style={{
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', height: 'fit-content',
            maxHeight: isMobile ? 'none' : 'calc(100vh - 100px)', overflowY: isMobile ? 'visible' : 'auto',
            position: isMobile ? 'static' : 'sticky', top: '84px',
            display: isMobile && !filtersOpen ? 'none' : 'block'
          }}>
            {/* Alkategóriák */}
            {selectedCategory && currentSubcategories.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <Filter size={15} /> Alkategóriák
                </h3>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.1rem', marginBottom: '0.85rem',
                  maxHeight: '190px', overflowY: 'auto', paddingRight: '0.25rem'
                }}>
                  <button onClick={() => setSelectedSubcategory(null)} style={{
                    padding: '0.35rem 0.6rem', border: 'none',
                    backgroundColor: selectedSubcategory === null ? '#0F2A1D' : 'transparent',
                    color: selectedSubcategory === null ? 'white' : '#333',
                    cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem',
                    fontWeight: selectedSubcategory === null ? 'bold' : 'normal', flexShrink: 0
                  }}>
                    Mind ({products.filter(p => p.categoryId === selectedCategory).length})
                  </button>
                  {currentSubcategories.map(sub => {
                    const count = products.filter(p => p.subcategoryId === sub.id).length;
                    return (
                      <button key={sub.id} onClick={() => setSelectedSubcategory(sub.id)} style={{
                        padding: '0.35rem 0.6rem', border: 'none',
                        backgroundColor: selectedSubcategory === sub.id ? '#0F2A1D' : 'transparent',
                        color: selectedSubcategory === sub.id ? 'white' : '#333',
                        cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem',
                        fontWeight: selectedSubcategory === sub.id ? 'bold' : 'normal', flexShrink: 0
                      }}>
                        {sub.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Ár szűrő */}
            <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Ár
            </h3>
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="number" value={priceMin} onChange={e => setPriceMin(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '50%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  placeholder="Min" />
                <input type="number" value={priceMax} onChange={e => setPriceMax(Math.max(priceMin, parseInt(e.target.value) || 50000))}
                  style={{ width: '50%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  placeholder="Max" />
              </div>
              <DualRangeSlider
                min={0} max={defaultMaxPrice} step={100}
                valueMin={priceMin} valueMax={priceMax}
                onChange={(mn, mx) => { setPriceMin(mn); setPriceMax(mx); }}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                {priceMin.toLocaleString('hu-HU')} - {priceMax.toLocaleString('hu-HU')} Ft
              </p>
            </div>

            {/* Márka szűrő */}
            {allBrands.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Márka
                </h3>
                <div style={{ marginBottom: '0.85rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {allBrands.map(brand => (
                    <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.15rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={selectedBrands.includes(brand)}
                        onChange={() => toggleArrayItem(selectedBrands, setSelectedBrands, brand)} />
                      {brand}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Iparági szűrő — meglévő, pontosan címkézett alkategóriákból */}
            {allIndustries.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Iparág
                </h3>
                <div style={{ marginBottom: '0.85rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {allIndustries.map(ind => (
                    <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.15rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={selectedIndustries.includes(ind)}
                        onChange={() => toggleArrayItem(selectedIndustries, setSelectedIndustries, ind)} />
                      {ind}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Méret szűrő — csak kategórián belül (kategória nélkül a cipő/ruha/
                méteráru méretek összemosódnának, áttekinthetetlen listát adva) */}
            {selectedCategory && allSizes.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Méret
                </h3>
                <div style={{
                  marginBottom: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem',
                  maxHeight: '150px', overflowY: 'auto', paddingRight: '0.25rem'
                }}>
                  {allSizes.map(size => (
                    <button key={size}
                      onClick={() => toggleArrayItem(selectedSizes, setSelectedSizes, size)}
                      style={{
                        padding: '0.3rem 0.55rem',
                        backgroundColor: selectedSizes.includes(size) ? '#0F2A1D' : 'white',
                        color: selectedSizes.includes(size) ? 'white' : '#333',
                        border: '1px solid #ddd', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Szabvány szűrő — csak ott jelenik meg kód, ahol a leírás ténylegesen tartalmazza */}
            {allStandards.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Szabvány
                </h3>
                <div style={{ marginBottom: '0.85rem', maxHeight: '130px', overflowY: 'auto' }}>
                  {allStandards.map(std => (
                    <label key={std} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.15rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={selectedStandards.includes(std)}
                        onChange={() => toggleArrayItem(selectedStandards, setSelectedStandards, std)} />
                      {std}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Csillag szűrő */}
            <h3 style={{ color: '#0F2A1D', marginBottom: '0.4rem', fontSize: '0.9rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Értékelés
            </h3>
            <div style={{ marginBottom: '0.85rem' }}>
              {[4, 3, 2, 1, 0].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.15rem 0', cursor: 'pointer' }}>
                  <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} fill={i <= r ? '#FFB800' : 'none'} color={i <= r ? '#FFB800' : '#ddd'} />
                    ))}
                    <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.25rem' }}>
                      {r === 0 ? 'Mind' : `${r}+`}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button onClick={resetFilters} style={{
              width: '100%', padding: '0.5rem', backgroundColor: 'transparent',
              color: '#0F2A1D', border: '1px solid #0F2A1D', borderRadius: '4px',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
            }}>
              🔄 {t("filter.reset")}
            </button>
          </aside>

          {/* Termékek lista */}
          <div>
            <div style={{
              backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '10px',
              marginBottom: activeChips.length > 0 ? '0.75rem' : '1.5rem', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0'
            }}>
              <span style={{ color: '#0F2A1D', fontWeight: 'bold' }}>{sortedProducts.length} {t('section.products')}</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #ddd', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: '#fafafa' }}>
                <option value="default">{t('filter.sort')}: {t('filter.sortDefault')}</option>
                <option value="price-asc">{t('filter.sortPriceAsc')}</option>
                <option value="price-desc">{t('filter.sortPriceDesc')}</option>
                <option value="name">{t('filter.sortName')}</option>
                <option value="rating">{t('filter.sortRating')}</option>
              </select>
            </div>

            {/* Aktív szűrő-chipek */}
            {activeChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                {activeChips.map(chip => (
                  <button key={chip.key} onClick={chip.onRemove} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    backgroundColor: '#0F2A1D', color: 'white', border: 'none',
                    borderRadius: '999px', padding: '0.35rem 0.5rem 0.35rem 0.9rem',
                    fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                  }}>
                    {chip.label}
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} />
                    </span>
                  </button>
                ))}
                <button onClick={() => { resetFilters(); setSelectedSubcategory(null); }} style={{
                  background: 'none', border: 'none', color: '#0F2A1D', cursor: 'pointer',
                  fontSize: '0.8rem', textDecoration: 'underline', fontWeight: 600, padding: '0.35rem 0.25rem'
                }}>
                  {t('filter.reset')}
                </button>
              </div>
            )}

            {sortedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#666', backgroundColor: 'white', borderRadius: '8px' }}>
                <Search size={64} style={{ color: '#ddd', marginBottom: '1rem' }} />
                <h3>Nincs találat</h3>
                <p>Próbálj más szűrési feltételeket vagy állítsd vissza a szűrőket!</p>
                <button onClick={resetFilters} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Szűrők visszaállítása
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1.5rem'
              }}>
                {sortedProducts.slice(0, visibleCount).map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => { setSelectedProduct(product); setSelectedSize(null); setSelectedColor(null); setQuantity(1); trackProductOpen(product, 'modal'); }}
                    onWishlist={(e) => handleWishlist(e, product.id)}
                    wished={wishlist.includes(product.id)}
                  />
                ))}
              </div>
            )}
            {sortedProducts.length > visibleCount && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={() => setVisibleCount(c => c + 24)} style={{
                  padding: '0.9rem 2.5rem', backgroundColor: '#0F2A1D', color: 'white',
                  border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
                }}>
                  Továbbiak betöltése ({sortedProducts.length - visibleCount} további termék)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          quantity={quantity}
          setQuantity={setQuantity}
          onAddToCart={() => addToCart(selectedProduct)}
          wished={wishlist.includes(selectedProduct.id)}
          onWishlist={(e) => handleWishlist(e, selectedProduct.id)}
        />
      )}

      {/* 1+1 ajánlatok — valódi kedvezmény: minden 2. darab ingyenes, a kosár és a számla is ekként számol.
          Minden nézeten megjelenik (főoldal, kategória-lista, keresés is), közvetlenül a
          termékrács/lapozás alatt, a bizalmi ikonsor előtt. */}
      {(() => {
        const bundles = BUNDLE_1PLUS1_IDS.map(id => products.find(p => p.id === id)).filter(Boolean);
        if (bundles.length === 0) return null;
        return (
          <div id="egy-plusz-egy" style={{ backgroundColor: '#0F2A1D', padding: '3rem 1.5rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: 'white', color: '#0F2A1D', fontWeight: 700, fontSize: '0.75rem',
                  padding: '0.35rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em'
                }}>
                  Kettő az ár fele
                </span>
                <h3 style={{
                  color: 'white', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.01em', margin: 0
                }}>
                  1+1 Ajánlataink
                </h3>
              </div>
              <p style={{ color: '#cfd8d1', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
                Vegyél kettőt, fizess egyet — a kedvezmény a kosárban és a számlán is valós.
              </p>
              <div style={{
                display: 'grid', gap: '1rem',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)'
              }}>
                {bundles.map(p => (
                  <div key={p.id} style={{
                    backgroundColor: 'white', borderRadius: 0, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <Link to={`/termek/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ position: 'relative', backgroundColor: '#fafafa', paddingTop: '90%' }}>
                        <img src={p.image} alt={p.name} loading="lazy" style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem'
                        }} />
                        <span style={{
                          position: 'absolute', top: '0.5rem', left: '0.5rem',
                          backgroundColor: '#C9A961', color: '#0F2A1D', fontWeight: 'bold', fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem', borderRadius: 0
                        }}>1+1</span>
                      </div>
                      <div style={{ padding: '0.65rem 0.75rem 0' }}>
                        <div style={{
                          color: '#333', fontSize: '0.8rem', lineHeight: 1.3, height: '2.1rem', overflow: 'hidden'
                        }}>{p.name}</div>
                        <div style={{ margin: '0.35rem 0' }}>
                          <div style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.72rem' }}>
                            {(p.sale && p.sale.active ? p.sale.price : p.price).toLocaleString('hu-HU')} Ft/db normál áron
                          </div>
                          <div style={{ color: '#0F2A1D', fontWeight: 'bold', fontSize: '1rem' }}>
                            {Math.round((p.sale && p.sale.active ? p.sale.price : p.price) / 2).toLocaleString('hu-HU')} Ft <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.72rem' }}>/db 1+1-gyel</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button onClick={() => addBundleToCart(p)} style={{
                      margin: '0 0.75rem 0.75rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
                      borderRadius: 0, padding: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold',
                      textTransform: 'uppercase', letterSpacing: '0.02em'
                    }}>
                      2 db kosárba
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Trust Section — kövér, négyzetes ikon-blokkok a kerek/lágy forma helyett */}
      <div style={{ backgroundColor: 'white', padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { Icon: Truck, title: 'Gyors Kiszállítás', text: '2-3 munkanapon belül országosan' },
              { Icon: Shield, title: 'Minőségi Garancia', text: 'EU tanúsított termékek' },
              { Icon: Award, title: 'Szakértő Tanácsadás', text: 'Szakértő segítség a választáshoz' },
              { Icon: Phone, title: 'Ügyfélszolgálat', text: homepageContent.topBarPhone || '+36 30 272 2571' }
            ].map((item, i) => (
              <div key={i}>
                <div style={{
                  width: '64px', height: '64px', backgroundColor: '#0F2A1D', margin: '0 auto 1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <item.Icon size={30} style={{ color: '#C9A961' }} />
                </div>
                <h3 style={{ color: '#0F2A1D', margin: '0 0 0.4rem 0', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hasznos bejegyzések — blog-teaser a főoldalon */}
      {!selectedCategory && !searchTerm && (() => {
        const latestPosts = getBlogPosts().slice(0, 4);
        if (latestPosts.length === 0) return null;
        return (
          <div style={{ backgroundColor: '#fafaf8', padding: '3rem 1.5rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <h3 style={{
                color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.8rem', textAlign: 'center',
                textTransform: 'uppercase', margin: '0 0 2rem 0'
              }}>
                Hasznos bejegyzések
              </h3>
              <div style={{
                display: 'grid', gap: '1.5rem',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)'
              }}>
                {latestPosts.map(post => (
                  <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={post.image} alt={post.title} loading="lazy" style={{
                      width: '100%', height: '160px', objectFit: 'cover', borderRadius: 0, marginBottom: '1rem'
                    }} />
                    <h4 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.05rem', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                      {post.title}
                    </h4>
                    <p style={{ color: '#666', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hírlevél-banner — teljes szélességű, kiemelt sáv, diagonál arany csíkkal fent */}
      <div style={{ backgroundColor: '#0F2A1D', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '10px',
          backgroundColor: '#C9A961', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 30%)'
        }} />
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '2.5rem 1.5rem' : '3rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center'
        }}>
          <div style={{
            flexShrink: 0, width: '4.5rem', height: '4.5rem', backgroundColor: '#C9A961',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Mail size={30} style={{ color: '#0F2A1D' }} />
          </div>

          <div style={{ flex: 1, minWidth: '260px', textAlign: isMobile ? 'center' : 'left' }}>
            <h3 style={{
              color: 'white', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
              fontWeight: 700, margin: '0 0 0.6rem 0'
            }}>
              {homepageContent.newsletterHeading || 'Iratkozz fel, hogy segíthessünk a tökéletes választásban!'}
            </h3>
            <ul style={{
              margin: 0, padding: 0, listStyle: 'none', color: '#cfd8d1', fontSize: '0.88rem',
              display: 'flex', flexDirection: 'column', gap: '0.3rem'
            }}>
              {((homepageContent.newsletterBullets && homepageContent.newsletterBullets.length > 0)
                ? homepageContent.newsletterBullets
                : [
                    'Az aktuális akciókat elsőként nálunk éred el',
                    'Szezonális ajánlatok és vásárlási tippek egy helyen',
                    'Havonta max. 2 email, bármikor leiratkozhatsz'
                  ]
              ).map((b, i) => <li key={i}>✓ {b}</li>)}
            </ul>
          </div>

          <div style={{ flexShrink: 0, minWidth: '260px' }}>
            {newsletterDone ? (
              <p style={{ color: '#C9A961', fontWeight: 'bold', margin: 0 }}>✔ Feliratkoztál, köszönjük!</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="email" placeholder="Email-címed" value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: '0.7rem 0.9rem', borderRadius: 0, border: 'none', fontSize: '0.9rem' }} />
                <button onClick={() => subscribeNewsletter('banner')} style={{
                  backgroundColor: '#C9A961', color: '#0F2A1D', border: 'none', padding: '0.7rem 1.3rem',
                  borderRadius: 0, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap',
                  textTransform: 'uppercase', letterSpacing: '0.02em'
                }}>
                  Feliratkozom
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0a1f19', color: '#bbb', padding: '3rem 1.5rem 1rem', fontSize: '0.9rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <h4 style={{ color: 'white', marginTop: 0 }}>🛡️ TridentShop</h4>
              </Link>
              <p style={{ lineHeight: 1.6 }}>
                Munkavédelmi ruházat, cipők és felszerelések közvetlenül raktárról.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Kategóriák</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {productCategories.map(cat => (
                  <li key={cat.id} style={{ marginBottom: '0.5rem' }}>
                    <button onClick={() => { setSelectedCategory(cat.id); window.scrollTo(0, 0); }}
                      style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Információ</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/blog" style={{ color: '#bbb', textDecoration: 'none' }}>Blog</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/wishlist" style={{ color: '#bbb', textDecoration: 'none' }}>Kedvenceim</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/gyik" style={{ color: '#bbb', textDecoration: 'none' }}>Gyakori kérdések</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/rendeles-kovetes" style={{ color: '#bbb', textDecoration: 'none' }}>Rendeléskövetés</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/fiok" style={{ color: '#bbb', textDecoration: 'none' }}>Fiókom</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/about" style={{ color: '#bbb', textDecoration: 'none' }}>Rólunk</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/shipping" style={{ color: '#bbb', textDecoration: 'none' }}>Szállítási feltételek</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/terms" style={{ color: '#bbb', textDecoration: 'none' }}>ÁSZF</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/privacy" style={{ color: '#bbb', textDecoration: 'none' }}>Adatvédelem</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/impressum" style={{ color: '#bbb', textDecoration: 'none' }}>Impresszum</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Kapcsolat</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Phone size={14} /> {homepageContent.topBarPhone || '+36 30 272 2571'}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Mail size={14} /> {homepageContent.topBarEmail || 'iroda@tuz-munkavedelmiszaki.hu'}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} /> 4030 Debrecen, Keleti Ipartelep utca 4.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>Hírlevél</h4>
              <p style={{ color: '#bbb', fontSize: '0.85rem', marginTop: 0 }}>
                Akciók, új termékek, kuponok — havonta max. 2 email, spam nélkül.
              </p>
              {newsletterDone ? (
                <p style={{ color: '#C9A961', fontWeight: 'bold' }}>✔ Feliratkoztál, köszönjük!</p>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="email" placeholder="Email-címed" value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#1a3f33', color: 'white', fontSize: '0.85rem' }} />
                  <button onClick={async () => {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newsletterEmail)) { alert('Kérlek, érvényes email-címet adj meg.'); return; }
                    try {
                      await fetch('/.netlify/functions/newsletter-api', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ op: 'subscribe', email: newsletterEmail, source: 'footer' })
                      });
                    } catch (e) { /* offline dev: nem blokkolunk */ }
                    setNewsletterDone(true);
                  }} style={{ backgroundColor: '#C9A961', color: '#0F2A1D', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    Feliratkozom
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ margin: 0 }}>© 2026 TridentShop - Minden jog fenntartva</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// HERO-KARUSSZEL — automatikusan váltakozó promó-sávok, pötty-navigációval, hover-re megáll
// ============================================================
// Hero — Liquid Death-ihletésű bátor, tipográfia-vezérelt rotáló sáv (nagy, kövér
// cím, rövid kikker-címke, éles sarkú, nagy CTA-gomb) + Uniqlo-ihletésű visszafogott
// szerkezet (egy üzenet / dia, sok fehértér, nincs zsúfolt díszítés/termékfotó-kollázs).
const HeroCarousel = ({ t, productCount, isMobile, bestSaleProduct, content = {} }) => {
  const scrollToId = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };

  const slides = [
    {
      bg: '#0F2A1D', kicker: 'TRIDENTSHOP',
      // Hosszú, kétsoros cím — kisebb betűméretet kap (titleSize), hogy a dia
      // magassága a többivel azonos maradjon, ne törjön 4-5 sorra
      titleSize: 'clamp(1.7rem, 2.6vw, 2.6rem)',
      title: (content.heroTitle1 || content.heroTitle2) ? (
        <>{content.heroTitle1 || 'A MUNKÁD MEGVÉD MINKET.'}<br /><span style={{ color: '#C9A961' }}>{content.heroTitle2 || 'MI MEGVÉDÜNK TÉGED.'}</span></>
      ) : (
        <>A MUNKÁD MEGVÉD MINKET.<br /><span style={{ color: '#C9A961' }}>MI MEGVÉDÜNK TÉGED.</span></>
      ),
      text: content.heroText || `${productCount.toLocaleString('hu-HU')}+ eredeti Portwest munkaruha, védőcipő és felszerelés.`,
      ctaLabel: content.heroCtaLabel || t('hero.ctaDeals'), ctaTarget: 'akcios-sav',
      cta2Label: t('hero.ctaCategories'), cta2Target: 'kategoriak'
    },
    ...(bestSaleProduct ? [{
      bg: '#0F2A1D', kicker: 'AKCIÓ',
      title: <>AKÁR −{Math.round((1 - bestSaleProduct.sale.price / bestSaleProduct.price) * 100)}%<br />KEDVEZMÉNY.</>,
      text: `${bestSaleProduct.name} — most ${bestSaleProduct.sale.price.toLocaleString('hu-HU')} Ft, amíg a készlet tart.`,
      ctaLabel: 'Akciók megnézése', ctaTarget: 'akcios-sav'
    }] : []),
    {
      bg: '#C9A961', dark: true, kicker: '1+1',
      title: <>VEGYÉL KETTŐT,<br />FIZESS EGYET.</>,
      text: 'Kesztyű, füldugó, védőszemüveg és maszk — minden 2. darab valóban ingyenes.',
      ctaLabel: '1+1 ajánlatok', ctaTarget: 'egy-plusz-egy'
    },
    {
      bg: '#0F2A1D', kicker: 'SZÁLLÍTÁS',
      title: <>INGYENES SZÁLLÍTÁS<br />30 000 FT FELETT.</>,
      text: '100% eredeti Portwest termékek CE-tanúsítvánnyal, 14 napos csere és visszaküldés.',
      ctaLabel: t('hero.ctaCategories'), ctaTarget: 'kategoriak'
    }
  ];

  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!pausedRef.current) setActive(a => (a + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slide = slides[active];

  // Diagonál két-szín vágás: minden dián a masik brand-szín ferde blokkja
  // jelenik meg a jobb oldalon (dark:true -> zöld diagonál arany alapon,
  // egyébként arany diagonál zöld alapon) — sokkal erősebb kontraszt, mint
  // egy sima egyszínű sáv.
  const accentColor = slide.dark ? '#0F2A1D' : '#C9A961';
  const textColor = slide.dark ? '#0F2A1D' : 'white';

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      style={{
        position: 'relative', backgroundColor: slide.bg, color: textColor, borderRadius: 0,
        overflow: 'hidden', minHeight: isMobile ? '440px' : '560px',
        display: 'flex', alignItems: 'center'
      }}
    >
      {!isMobile && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '55%',
          backgroundColor: accentColor,
          clipPath: 'polygon(38% 0, 100% 0, 100% 100%, 8% 100%)'
        }} />
      )}

      <div style={{
        position: 'relative', maxWidth: '620px', padding: isMobile ? '3rem 1.5rem' : '4rem 4rem 4rem 4rem',
        textAlign: 'left'
      }}>
        <span style={{
          display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: '0.85rem', fontWeight: 700,
          letterSpacing: '0.25em', color: slide.dark ? '#0F2A1D' : '#C9A961', marginBottom: '1.5rem',
          borderTop: `3px solid ${slide.dark ? '#0F2A1D' : '#C9A961'}`, borderBottom: `3px solid ${slide.dark ? '#0F2A1D' : '#C9A961'}`,
          padding: '0.35rem 0'
        }}>
          {slide.kicker}
        </span>
        <h2 style={{
          // A szövegoszlop ~560px széles — az alap címméret úgy van belőve, hogy a
          // címek 2 sorban maradjanak (a leghosszabb címû első dia még kisebbet kap)
          fontSize: isMobile ? '1.8rem' : (slide.titleSize || 'clamp(1.9rem, 3vw, 3rem)'),
          margin: '0 0 1.25rem 0', fontFamily: 'Georgia, serif',
          fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.02em'
        }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: '1.15rem', margin: '0 0 2.25rem 0', opacity: 0.92, maxWidth: '460px' }}>
          {slide.text}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => scrollToId(slide.ctaTarget)} style={{
            backgroundColor: '#C9A961', color: '#0F2A1D', border: 'none', padding: '1.1rem 2.4rem',
            borderRadius: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', cursor: 'pointer'
          }}>
            {slide.ctaLabel}
          </button>
          {slide.cta2Label && (
            <button onClick={() => scrollToId(slide.cta2Target)} style={{
              backgroundColor: 'transparent', color: textColor, border: `2px solid ${textColor}`, padding: '1.1rem 2.4rem',
              borderRadius: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase', cursor: 'pointer'
            }}>
              {slide.cta2Label}
            </button>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '1.5rem', left: 0, right: 0,
        display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start', paddingLeft: isMobile ? 0 : '4rem', gap: '0.6rem'
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} aria-label={`${i + 1}. sáv`} style={{
            width: i === active ? '30px' : '10px', height: '5px', borderRadius: 0, border: 'none',
            backgroundColor: i === active ? '#C9A961' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.25s'
          }} />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// AKCIÓS SÁV — vízszintesen görgethető kártyasor, nyíl-navigációval
// ============================================================
const arrowBtnStyle = (side) => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: '-14px', zIndex: 2,
  width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #eee',
  backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2A1D'
});

const SaleCarouselRow = ({ items }) => {
  const scrollRef = useRef(null);
  const scrollBy = (dx) => { if (scrollRef.current) scrollRef.current.scrollBy({ left: dx, behavior: 'smooth' }); };

  return (
    <div id="akcios-sav" style={{ backgroundColor: '#f5f5f5', padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: '#C9A961', color: '#0F2A1D', fontWeight: 700, fontSize: '0.75rem',
            padding: '0.35rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            Most
          </span>
          <h3 style={{
            color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.01em', margin: 0
          }}>
            Akciós ajánlatok
          </h3>
        </div>
        <p style={{ color: '#666', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
          Válogatott kedvezmények, amíg a készlet tart.
        </p>
        <div style={{ position: 'relative' }}>
          <button onClick={() => scrollBy(-420)} aria-label="Előző" style={arrowBtnStyle('left')}>
            <ChevronLeft size={20} />
          </button>
          <div ref={scrollRef} style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollBehavior: 'smooth' }}>
            {items.map(p => (
              <Link key={p.id} to={`/termek/${p.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '190px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={p.image} alt={p.name} loading="lazy" style={{ width: '100%', height: '150px', objectFit: 'contain', backgroundColor: '#fafafa' }} />
                    <span style={{
                      position: 'absolute', top: '8px', left: '8px', color: 'white', padding: '2px 8px',
                      borderRadius: 0, fontSize: '0.75rem', fontWeight: 'bold',
                      backgroundColor: p.isBundleSlot ? '#C9A961' : '#D32F2F'
                    }}>
                      {p.isBundleSlot ? '1+1' : `−${Math.round((1 - p.sale.price / p.price) * 100)}%`}
                    </span>
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ color: '#333', fontSize: '0.85rem', height: '2.5em', overflow: 'hidden', lineHeight: 1.25 }}>{p.name}</div>
                    <div style={{ marginTop: '0.5rem' }}>
                      {p.isBundleSlot ? (
                        <>
                          <span style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                            {(p.sale && p.sale.active ? p.sale.price : p.price).toLocaleString('hu-HU')} Ft/db
                          </span>
                          <span style={{ color: '#0F2A1D', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            {Math.round((p.sale && p.sale.active ? p.sale.price : p.price) / 2).toLocaleString('hu-HU')} Ft/db
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                            {p.price.toLocaleString('hu-HU')} Ft
                          </span>
                          <span style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            {p.sale.price.toLocaleString('hu-HU')} Ft
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <button onClick={() => scrollBy(420)} aria-label="Következő" style={arrowBtnStyle('right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// KÉTVÉGŰ ÁR-CSÚSZKA (mindkét fogantyú húzható, egér és érintés is)
// ============================================================
const DualRangeSlider = ({ min, max, valueMin, valueMax, step = 100, onChange }) => {
  const trackRef = useRef(null);
  const draggingRef = useRef(null);

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const pctFor = (v) => max > min ? ((v - min) / (max - min)) * 100 : 0;

  const valueFromClientX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const pct = rect.width > 0 ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
    const raw = min + pct * (max - min);
    return clamp(Math.round(raw / step) * step);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const v = valueFromClientX(clientX);
      if (draggingRef.current === 'min') onChange(Math.min(v, valueMax - step), valueMax);
      else onChange(valueMin, Math.max(v, valueMin + step));
    };
    const handleUp = () => { draggingRef.current = null; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMin, valueMax, min, max, step]);

  const thumbStyle = (pct) => ({
    position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)',
    width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#0F2A1D',
    border: '3px solid white', boxShadow: '0 1px 5px rgba(0,0,0,0.35)', cursor: 'grab',
    touchAction: 'none', zIndex: 2
  });

  return (
    <div ref={trackRef} style={{ position: 'relative', height: '6px', backgroundColor: '#e8e8e3', borderRadius: '3px', margin: '0.9rem 0.1rem' }}>
      <div style={{
        position: 'absolute', height: '100%', backgroundColor: '#C9A961', borderRadius: '3px',
        left: `${pctFor(valueMin)}%`, right: `${100 - pctFor(valueMax)}%`
      }} />
      <div
        role="slider" aria-label="Minimum ár" tabIndex={0}
        aria-valuemin={min} aria-valuemax={valueMax} aria-valuenow={valueMin}
        onMouseDown={() => { draggingRef.current = 'min'; }}
        onTouchStart={() => { draggingRef.current = 'min'; }}
        style={thumbStyle(pctFor(valueMin))}
      />
      <div
        role="slider" aria-label="Maximum ár" tabIndex={0}
        aria-valuemin={valueMin} aria-valuemax={max} aria-valuenow={valueMax}
        onMouseDown={() => { draggingRef.current = 'max'; }}
        onTouchStart={() => { draggingRef.current = 'max'; }}
        style={thumbStyle(pctFor(valueMax))}
      />
    </div>
  );
};

// ============================================================
// PRODUCT CARD
// ============================================================
const ProductCard = ({ product, onSelect, onWishlist, wished }) => {

  return (
    // Uniqlo-stílusú flat kártya: nincs keret/árnyék, a kép világosszürke mezőn ül,
    // hover-re csak a kép mező sötétedik kicsit — a tipográfia viszi a hangsúlyt.
    <div onClick={onSelect} style={{
      backgroundColor: 'transparent', borderRadius: 0, overflow: 'hidden',
      cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative'
    }}
      onMouseEnter={(e) => { const im = e.currentTarget.querySelector('[data-imgbox]'); if (im) im.style.backgroundColor = '#ececec'; }}
      onMouseLeave={(e) => { const im = e.currentTarget.querySelector('[data-imgbox]'); if (im) im.style.backgroundColor = '#f5f5f5'; }}
    >
      {/* Wishlist heart */}
      <button onClick={onWishlist} title={wished ? 'Eltávolítás kedvencekből' : 'Kedvencekhez'} style={{
        position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2,
        backgroundColor: 'white', border: 'none', borderRadius: '50%',
        width: '36px', height: '36px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Heart size={18} fill={wished ? '#d32f2f' : 'none'} color="#d32f2f" />
      </button>

      <div data-imgbox style={{ position: 'relative', backgroundColor: '#f5f5f5', padding: '1.25rem', transition: 'background-color 0.2s' }}>
        <img src={product.image} alt={product.name} loading="lazy" style={{ width: '100%', height: '210px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        {product.stock < 20 && product.stock > 0 && (
          <span style={{
            position: 'absolute', top: '0.5rem', left: '0.5rem',
            backgroundColor: '#FF9800', color: 'white',
            padding: '0.25rem 0.5rem', borderRadius: 0, fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase'
          }}>
            Utolsó {product.stock} db!
          </span>
        )}
        {product.sale && product.sale.active && (
          <span style={{
            position: 'absolute', top: product.stock < 20 ? '2.25rem' : '0.5rem', left: '0.5rem',
            backgroundColor: '#d32f2f', color: 'white',
            padding: '0.25rem 0.5rem', borderRadius: 0, fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase'
          }}>
            {product.sale.label || 'AKCIÓ'}
          </span>
        )}
        {isBundleProduct(product.id) && (
          <span style={{
            position: 'absolute', bottom: '0.5rem', left: '0.5rem',
            backgroundColor: '#C9A961', color: '#0F2A1D',
            padding: '0.25rem 0.5rem', borderRadius: 0, fontSize: '0.72rem', fontWeight: 'bold'
          }}>
            1+1
          </span>
        )}
      </div>

      <div style={{ padding: '0.85rem 0.25rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Uniqlo-minta: kategória + méret-tartomány egy sorban, halvány meta-ként */}
        <p style={{ color: '#8a8a8a', fontSize: '0.72rem', margin: '0 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {productCategories.find(c => c.id === product.categoryId)?.name}
          {(() => {
            const sz = (product.sizes || []).filter(s => s && s !== '-');
            return sz.length > 1 ? `, ${sz[0]}–${sz[sz.length - 1]}` : '';
          })()}
        </p>

        <Link to={`/termek/${product.slug}`} onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', color: '#0F2A1D' }}>
          <h3 style={{ color: '#0F2A1D', margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 'bold', minHeight: '2.6em', lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>

        {(() => {
          const inStockVariants = (product.variants || []).filter(v => v.stock > 0);
          if (inStockVariants.length < 2) return null;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0 0 0.5rem 0' }}>
              {inStockVariants.map(v => {
                const hexes = resolveColorHexes(v.color);
                const bg = hexes.length === 2
                  ? `linear-gradient(90deg, ${hexes[0]} 50%, ${hexes[1]} 50%)`
                  : (hexes[0] || '#ccc');
                return (
                  <span key={v.code} title={v.color} style={{
                    width: '18px', height: '18px', borderRadius: '4px', background: bg,
                    border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block'
                  }} />
                );
              })}
            </div>
          );
        })()}

        {(() => {
          // "Több színben" csak akkor, ha legalább 3 szín TÉNYLEGESEN raktáron van
          const inStockColorCount = (product.variants || []).filter(v => v.stock > 0).length;
          // "Nagy méretekben is!" csak felsőknél/nadrágoknál értelmezhető — cipőméretnél
          // vagy kesztyűnél az XL-jelölés mást jelentene. Csak 3XL FELETT (4XL+) számít nagynak.
          const isTopOrPants = product.subcategoryId === 'felsok' || product.subcategoryId === 'nadragok';
          const hasBigSizes = isTopOrPants && (product.sizes || []).some(s => /^(4|5|6|7|8)XL/i.test(s));
          const text = `${product.name} ${product.description || ''}`.toLowerCase();
          let season = null;
          // Sorrend számít: a téli a legerősebb jel; az eső-/átmeneti darabok (esőkabát,
          // vízálló, softshell) SOSEM kapnak "Nyári" címkét, hanem "Tavaszi–őszi"-t;
          // a "szellőző" szó önmagában nem nyári jel (esőkabát-leírásokban is szerepel).
          if (/téli|bélelt|polár|thermo|hőszigetelt/.test(text)) season = { label: 'Téli' };
          else if (/eső|vízálló|vízhatlan|átmeneti|softshell|széldzseki/.test(text)) season = { label: 'Tavaszi–őszi' };
          else if (/nyári|hűsítő|cooling/.test(text)) season = { label: 'Nyári' };
          else if (/őszi/.test(text)) season = { label: 'Tavaszi–őszi' };
          if (inStockColorCount < 3 && !hasBigSizes && !season) return null;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0 0 0.5rem 0' }}>
              {inStockColorCount >= 3 && (
                <span style={{ backgroundColor: '#eef1ee', color: '#0F2A1D', fontSize: '0.68rem', fontWeight: 'bold', padding: '0.2rem 0.55rem', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Több színben
                </span>
              )}
              {hasBigSizes && (
                <span style={{ backgroundColor: '#eef1ee', color: '#0F2A1D', fontSize: '0.68rem', fontWeight: 'bold', padding: '0.2rem 0.55rem', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Nagy méretekben is
                </span>
              )}
              {season && (
                <span style={{ backgroundColor: '#eef1ee', color: '#0F2A1D', fontSize: '0.68rem', fontWeight: 'bold', padding: '0.2rem 0.55rem', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {season.label}
                </span>
              )}
            </div>
          );
        })()}

        <div style={{ marginTop: 'auto' }}>
          {product.sale && product.sale.active ? (
            <div style={{ margin: '0.5rem 0' }}>
              <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                {product.price.toLocaleString('hu-HU')} Ft
              </span>
              <span style={{ color: '#d32f2f', fontSize: '1.3rem', fontWeight: 'bold' }}>
                {product.sale.price.toLocaleString('hu-HU')} Ft
              </span>
            </div>
          ) : (() => {
            // Valós piaci összevetés — CSAK ha tényleges, jelentős (>=300 Ft) a
            // különbség a piacon talált legolcsóbb ajánlathoz képest. Nem
            // mesterséges "listaár", ezért nem jelenik meg a katalógus minden
            // elemén — csak ott, ahol tényleg igaz és számít.
            const realSave = (product.competitorPrice > 0 && product.competitorPrice - product.price >= 300)
              ? product.competitorPrice - product.price : 0;
            return realSave > 0 ? (
              <div style={{ margin: '0.5rem 0' }}>
                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', marginRight: '0.5rem' }} title="Piaci legolcsóbb ajánlat">
                  {product.competitorPrice.toLocaleString('hu-HU')} Ft
                </span>
                <span style={{ color: '#0F2A1D', fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {product.price.toLocaleString('hu-HU')} Ft
                </span>
                <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                  −{realSave.toLocaleString('hu-HU')} Ft
                </span>
              </div>
            ) : (
              <p style={{ color: '#C9A961', fontSize: '1.3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {product.price.toLocaleString('hu-HU')} Ft
              </p>
            );
          })()}

          {product.stock > 0 ? (
            <p style={{ color: '#2e7d32', fontSize: '0.76rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <PackageCheck size={13} /> Raktáron · 2-3 munkanap
            </p>
          ) : (
            <p style={{ color: '#c62828', fontSize: '0.76rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'bold' }}>
              <X size={13} /> Nincs raktáron
            </p>
          )}

          <button onClick={(e) => { e.stopPropagation(); onSelect(); }} disabled={product.stock === 0} style={{
            width: '100%', backgroundColor: product.stock === 0 ? '#ccc' : '#0F2A1D', color: 'white',
            padding: '0.6rem', borderRadius: 0, border: 'none',
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
            textTransform: 'uppercase', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <ShoppingCart size={16} /> {product.stock === 0 ? 'Elfogyott' : 'Kosárba'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PRODUCT MODAL
// ============================================================
const ProductModal = ({ product, onClose, selectedSize, setSelectedSize, selectedColor, setSelectedColor, quantity, setQuantity, onAddToCart, wished, onWishlist }) => {
  const [modalSizeChart, setModalSizeChart] = useState(null);
  const variants = product.variants || [];
  const activeVariant = variants.find(v => v.code === selectedColor) || (variants.length === 1 ? variants[0] : null);
  const displayStock = activeVariant ? activeVariant.stock : product.stock;

  // Galéria: mindig csak az aktuálisan megjelenített (kiválasztott, vagy annak
  // hiányában az első) szín képsorozata jelenjen meg — sosem az összes szín kevert kollázsa.
  const galleryColor = selectedColor || (variants.length > 0 ? variants[0].code : null);
  const images = getProductImages(product, galleryColor);
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => { setImgIdx(0); }, [galleryColor, product.id]);
  const safeIdx = Math.min(imgIdx, images.length - 1);
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);
  const arrowStyle = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    backgroundColor: 'rgba(15,42,29,0.75)', color: 'white', border: 'none',
    borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'white', borderRadius: '8px',
        maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#f9f9f9' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <img src={images[safeIdx] || product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }} />
            {images.length > 1 && (
              <>
                <button onClick={prevImg} aria-label="Előző kép" style={{ ...arrowStyle, left: '0.25rem' }}>‹</button>
                <button onClick={nextImg} aria-label="Következő kép" style={{ ...arrowStyle, right: '0.25rem' }}>›</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <button key={img} onClick={() => setImgIdx(i)} aria-label={`${i + 1}. kép`} style={{
                  padding: 0, border: i === safeIdx ? '2px solid #C9A961' : '2px solid #ddd',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white',
                  opacity: i === safeIdx ? 1 : 0.7
                }}>
                  <img src={img} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', display: 'block', borderRadius: '2px' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase' }}>
              {productCategories.find(c => c.id === product.categoryId)?.name}
            </p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
              <X size={24} />
            </button>
          </div>

          <h2 style={{
            color: '#0F2A1D', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontFamily: 'Georgia, serif',
            fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.15
          }}>{product.name}</h2>
          {product.brand && product.brand !== 'Generic' && (
            <p style={{ color: '#666', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              Márka: <strong>{product.brand}</strong>
            </p>
          )}

          <p style={{ color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>{product.description}</p>

          <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', borderLeft: '4px solid #C9A961' }}>
            {product.sale && product.sale.active ? (
              <>
                <p style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.1rem', margin: 0 }}>
                  {product.price.toLocaleString('hu-HU')} Ft
                </p>
                <p style={{ color: '#d32f2f', fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                  {product.sale.price.toLocaleString('hu-HU')} Ft
                  <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', backgroundColor: '#d32f2f', color: 'white', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {product.sale.label || 'AKCIÓ'}
                  </span>
                </p>
              </>
            ) : (
              <p style={{ color: '#C9A961', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                {product.price.toLocaleString('hu-HU')} Ft
              </p>
            )}
            <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              📦 Raktáron: {displayStock} db{activeVariant ? ` (${activeVariant.color})` : ''}
            </p>
          </div>

          {variants.length > 1 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>Szín:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {variants.map(v => (
                  <button key={v.code} onClick={() => setSelectedColor(v.code)} disabled={v.stock === 0} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '4px',
                    border: `2px solid ${selectedColor === v.code ? '#0F2A1D' : '#ddd'}`,
                    backgroundColor: selectedColor === v.code ? '#0F2A1D' : 'white',
                    color: v.stock === 0 ? '#bbb' : (selectedColor === v.code ? 'white' : '#0F2A1D'),
                    cursor: v.stock === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                    textDecoration: v.stock === 0 ? 'line-through' : 'none'
                  }}>{v.color}</button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (() => {
            const sizeStock = activeVariant && activeVariant.sizeStock ? activeVariant.sizeStock : null;
            // Csak a ténylegesen raktáron lévő méretek jelenjenek meg — nem kitöltő,
            // áthúzott "elfogyott" gombokkal. Ha sizeStock nincs (nincs szín-szintű
            // adat), minden méret látszik; a lista minden render-nél élőben újraszámol.
            const visibleSizes = sizeStock ? product.sizes.filter(size => (sizeStock[size] || 0) > 0) : product.sizes;
            return (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#0F2A1D' }}>Méret:</label>
                  {getSizeChart(product) && (
                    <button onClick={() => setModalSizeChart(getSizeChart(product))} style={{
                      background: 'none', border: 'none', color: '#0F2A1D', cursor: 'pointer',
                      textDecoration: 'underline', fontSize: '0.85rem', padding: 0
                    }}>
                      📏 Mérettáblázat
                    </button>
                  )}
                </div>
                {visibleSizes.length === 0 ? (
                  <p style={{ color: '#c62828', fontSize: '0.85rem', margin: 0 }}>Ebből a színből minden méret elfogyott.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {visibleSizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} style={{
                        padding: '0.5rem 0.85rem', borderRadius: 0,
                        border: `2px solid ${selectedSize === size ? '#0F2A1D' : '#ddd'}`,
                        backgroundColor: selectedSize === size ? '#0F2A1D' : 'white',
                        color: selectedSize === size ? 'white' : '#0F2A1D',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
                      }}>{size}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
              Mennyiség:
              {/* A kiválasztott méret készlete ide kerül a méret-gombok zárójelei helyett */}
              {selectedSize && activeVariant && activeVariant.sizeStock && activeVariant.sizeStock[selectedSize] > 0 && (
                <span style={{ fontWeight: 'normal', color: '#2e7d32', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  {activeVariant.sizeStock[selectedSize]} db raktáron
                </span>
              )}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '40px', height: '40px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', borderRadius: '4px' }}>−</button>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '80px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }} />
              <button onClick={() => setQuantity(quantity + 1)} style={{ width: '40px', height: '40px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', borderRadius: '4px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button onClick={onAddToCart} disabled={product.stock === 0} style={{
              flex: 1,
              backgroundColor: product.stock === 0 ? '#ccc' : '#C9A961', color: '#0F2A1D',
              padding: '1rem', borderRadius: '4px', border: 'none',
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontSize: '1.05rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <ShoppingCart size={20} />
              {product.stock === 0 ? 'Elfogyott' : 'Kosárba'}
            </button>

            <button onClick={onWishlist} style={{
              padding: '1rem', backgroundColor: wished ? '#d32f2f' : 'white',
              color: wished ? 'white' : '#d32f2f',
              border: '2px solid #d32f2f', borderRadius: '4px', cursor: 'pointer'
            }}>
              <Heart size={20} fill={wished ? 'white' : 'none'} />
            </button>
          </div>

          <Link to={`/termek/${product.slug}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.8rem', textAlign: 'center', textDecoration: 'none',
            color: '#0F2A1D', backgroundColor: '#f5f7f5', border: '2px solid #0F2A1D',
            borderRadius: '4px', fontWeight: 'bold', fontSize: '0.95rem'
          }}>
            📄 Részletes termékoldal megnyitása →
          </Link>
        </div>
      </div>

      {modalSizeChart && (
        <SizeChartModal chart={modalSizeChart} onClose={() => setModalSizeChart(null)} />
      )}
    </div>
  );
};

export default WorkwearShop;
