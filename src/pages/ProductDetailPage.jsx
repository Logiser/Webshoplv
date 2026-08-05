import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Truck, Shield, Award, ChevronRight, ChevronLeft, Ruler, Phone, Mail, Search, User } from 'lucide-react';
import { productCategories, productSubcategories, getProductImages } from '../data/productData';
import { getProductBySlug, getVisibleProducts, toggleWishlist, isInWishlist, recordProductView, trackProductOpen, getWishlist, getHomepageContent } from '../data/storage';
import { trackViewItem, trackAddToCart, trackAddToWishlist } from '../utils/analytics';
import { getSizeChart } from '../data/sizeCharts';
import SizeChartModal from '../components/SizeChartModal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLang } from '../i18n/LanguageContext';

const headerIconBtn = {
  padding: '0.5rem 0.65rem', backgroundColor: 'transparent', border: 'none',
  borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: '0.35rem'
};

const headerBadge = {
  position: 'absolute', top: '-4px', right: '-4px',
  backgroundColor: '#d32f2f', color: 'white', borderRadius: '50%',
  width: '18px', height: '18px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.65rem', fontWeight: 'bold'
};

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const homepageContent = getHomepageContent();
  // Fejléc-állapotok (a főoldal fejlécével egyező kereső/fiók/kedvenc/kosár sáv)
  const [headerSearch, setHeaderSearch] = useState('');
  const [wishlist, setWishlist] = useState(() => getWishlist());
  const [cartCount, setCartCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('temp_cart') || '[]').length; } catch (e) { return 0; }
  });
  const handleHeaderSearch = (e) => {
    e.preventDefault();
    if (headerSearch.trim()) navigate(`/?search=${encodeURIComponent(headerSearch.trim())}`);
  };
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState([]);
  const [wished, setWished] = useState(false);
  // Valódi értékelések (reviews-api): jóváhagyott vélemények + beküldő űrlap
  const [reviews, setReviews] = useState([]);
  const [revForm, setRevForm] = useState({ name: '', stars: 5, text: '' });
  const [revSent, setRevSent] = useState(false);
  // Bazaarvoice-stílusú összegző: csillag-szűrő + rendezés
  const [revFilterStars, setRevFilterStars] = useState(null);
  const [revSort, setRevSort] = useState('top');
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    const p = getProductBySlug(slug);
    if (!p) {
      navigate('/');
      return;
    }
    setProduct(p);
    setImgIdx(0);
    // Alapból az első szín-variánsra állunk, hogy a galéria induláskor is
    // csak azt a képsorozatot mutassa, ne az összes szín kevert kollázsát.
    setSelectedColor((p.variants && p.variants.length > 0) ? p.variants[0].code : null);
    setWished(isInWishlist(p.id));
    recordProductView(p.id);
    trackProductOpen(p, 'oldal');   // PPC statisztika
    trackViewItem(p);  // GA4 + FB Pixel

    // Jóváhagyott értékelések betöltése
    setReviews([]);
    setRevSent(false);
    fetch('/.netlify/functions/reviews-api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'list', productId: p.id })
    }).then(r => r.json()).then(d => setReviews(d.reviews || [])).catch(() => {});

    // Kapcsolódó termékek (azonos alkategória)
    const allVisible = getVisibleProducts();
    setRelated(allVisible.filter(prod => prod.subcategoryId === p.subcategoryId && prod.id !== p.id).slice(0, 4));

    // SEO meta tagok
    const cat = productCategories.find(c => c.id === p.categoryId);
    document.title = `${p.name} | TridentShop`;

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

    const desc = p.description ? p.description.substring(0, 160) : `${p.name} - ${cat?.name || ''} - TridentShop webshopjából`;
    setMeta('description', desc);
    setMeta('keywords', `${p.name}, ${p.brand || ''}, ${cat?.name || ''}, munkavédelem`);
    // Relatív képútvonal abszolúttá alakítása (OG + schema.org kötelező)
    const absImage = (p.image || '').startsWith('http') ? p.image : `${window.location.origin}${p.image}`;
    setMeta('og:title', p.name, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', absImage, true);
    setMeta('og:type', 'product', true);

    return () => {
      const schemaScript = document.querySelector('script[type="application/ld+json"][data-product]');
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [slug, navigate]);

  // Schema.org Product + BreadcrumbList markup — külön effect, mert a reviews
  // aszinkron érkezik: a fenti effect lezárásakor még üres a lista. Ha ide is
  // beleírnánk a fenti effectbe, az aggregateRating sosem kerülne be, mert a
  // dependency-lista ([slug, navigate]) nem futtatná újra a reviews megérkezésekor.
  useEffect(() => {
    if (!product) return;
    const p = product;
    const cat = productCategories.find(c => c.id === p.categoryId);
    const absImage = (p.image || '').startsWith('http') ? p.image : `${window.location.origin}${p.image}`;

    const approved = reviews.filter(r => r.stars >= 1 && r.stars <= 5);
    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.name,
        "sku": p.articleNo || String(p.id),
        "image": absImage,
        "description": p.description,
        "brand": { "@type": "Brand", "name": p.brand || 'TridentShop' },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "HUF",
          "price": (p.sale && p.sale.active) ? p.sale.price : p.price,
          "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
        // aggregateRating: csak VALÓDI, jóváhagyott értékelésekből (reviews-api) —
        // kamu számot nem teszünk a sémába, ezért csak akkor szerepel, ha van min. 1
        ...(approved.length > 0 ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": (approved.reduce((s, r) => s + r.stars, 0) / approved.length).toFixed(1),
            "reviewCount": approved.length
          }
        } : {})
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Főoldal", "item": window.location.origin },
          { "@type": "ListItem", "position": 2, "name": cat?.name || 'Termékek', "item": window.location.origin },
          { "@type": "ListItem", "position": 3, "name": p.name, "item": window.location.href }
        ]
      }
    ];

    let schemaScript = document.querySelector('script[type="application/ld+json"][data-product]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-product', 'true');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);
  }, [product, reviews]);

  if (!product) return null;

  const cat = productCategories.find(c => c.id === product.categoryId);
  const subcat = productSubcategories.find(s => s.id === product.subcategoryId);
  const sizeChart = getSizeChart(product);
  const effectivePrice = (product.sale && product.sale.active) ? product.sale.price : product.price;

  const handleAddToCart = () => {
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
    // Beletesszük a kosárba (sessionStorage-en keresztül a főoldal kosarához)
    const cartData = JSON.parse(sessionStorage.getItem('temp_cart') || '[]');
    cartData.push({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      quantity,
      size: selectedSize,
      image: (variant && variant.image) || product.image,
      color: variant ? variant.color : null,
      colorCode: variant ? variant.code : null,
      variantStock: variant ? variant.stock : null,
      sizeStockAtAdd: (variant && variant.sizeStock && selectedSize) ? (variant.sizeStock[selectedSize] || 0) : null
    });
    sessionStorage.setItem('temp_cart', JSON.stringify(cartData));
    setCartCount(cartData.length);   // fejléc kosár-jelvény azonnali frissítése
    trackAddToCart(product, quantity);  // GA4 + FB Pixel
    alert(`✅ ${product.name} kosárba téve!`);
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    if (!wished) trackAddToWishlist(product);  // GA4 + FB Pixel
    setWished(!wished);
    setWishlist(getWishlist());   // fejléc kedvenc-jelvény azonnali frissítése
  };

  // Utolsó rendelés idő szövegezve - eltávolítva

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Info Bar — a főoldallal egyező, hogy a termékoldal ne tűnjön "külön" felületnek */}
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
          <LanguageSwitcher compact />
        </div>
      </div>

      {/* Header — azonos a főoldal fejlécével (logó, kereső, fiók/kedvenc/kosár) */}
      <header style={{
        backgroundColor: 'white', padding: '0.85rem 1.5rem',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderBottom: '1px solid #eee'
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap'
        }}>
          {/* p, nem h1 — a termékoldal egyetlen h1-je a termék neve legyen lentebb;
              a logó h1-ként duplikált címsort adott volna minden termékoldalon (SEO-hiba) */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Georgia, serif', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                display: 'inline-flex', width: '2.1rem', height: '2.1rem', borderRadius: '8px',
                backgroundColor: '#0F2A1D', color: '#C9A961', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>🛡️</span>
              <span>TridentShop</span>
            </p>
          </Link>

          <form onSubmit={handleHeaderSearch} style={{
            flex: 1, minWidth: '180px', maxWidth: '560px',
            display: 'flex', alignItems: 'center', backgroundColor: '#f5f6f5',
            borderRadius: '999px', padding: '0.15rem 0.15rem 0.15rem 1rem', border: '1.5px solid #e5e5e0'
          }}>
            <input
              type="text" placeholder={t('nav.search')}
              value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '0.55rem 0', fontSize: '0.95rem', outline: 'none', minWidth: 0 }}
            />
            <button type="submit" aria-label="Keresés" style={{
              backgroundColor: '#0F2A1D', border: 'none', borderRadius: '999px', width: '2.3rem', height: '2.3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#C9A961'
            }}>
              <Search size={17} />
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link to="/fiok" title={t('account.title')} style={headerIconBtn}>
              <User size={21} color="#0F2A1D" />
              <span style={{ fontSize: '0.78rem', color: '#0F2A1D', fontWeight: 600 }}>{t('account.title')}</span>
            </Link>

            <Link to="/wishlist" title={t('nav.favorites')} style={{ ...headerIconBtn, position: 'relative' }}>
              <Heart size={21} fill={wishlist.length > 0 ? '#d32f2f' : 'none'} color="#d32f2f" />
              {wishlist.length > 0 && <span style={headerBadge}>{wishlist.length}</span>}
            </Link>

            <Link to="/" title={t('nav.cart')} style={{
              backgroundColor: '#0F2A1D', color: 'white', textDecoration: 'none',
              padding: '0.6rem 1.1rem', borderRadius: '999px',
              display: 'flex', alignItems: 'center', gap: '0.55rem', position: 'relative'
            }}>
              <ShoppingCart size={19} color="#C9A961" />
              <span style={{ fontSize: '0.92rem', fontWeight: 'bold' }}>{t('nav.cart')}</span>
              {cartCount > 0 && (
                <span style={{ ...headerBadge, top: '-8px', right: '-8px', backgroundColor: '#C9A961', color: '#0F2A1D' }}>{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ backgroundColor: 'white', padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>Főoldal</Link>
          <ChevronRight size={14} />
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>{cat?.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#666' }}>{subcat?.name}</span>
          <ChevronRight size={14} />
          <span style={{ color: '#C9A961', fontWeight: 'bold' }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* Termék részletek — Liquid Death-minta: infó BALRA, nagy kép JOBBRA,
            kártya-keret nélkül, a kép a világos oldal-háttéren lebeg */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem', alignItems: 'start'
        }}>
          
          {/* Kép galéria - szín választásakor csak az adott szín nézetei */}
          {(() => {
            const images = getProductImages(product, selectedColor);
            const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
            const nextImg = () => setImgIdx(i => (i + 1) % images.length);
            // LD-minta: minimál, háttér nélküli vékony nyilak — a kép az oldal
            // világos hátterén lebeg, nincs külön kártya-mező körülötte
            const arrowStyle = {
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'transparent', color: '#0F2A1D', border: 'none',
              width: '44px', height: '44px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
            };
            return (
              <div style={{ padding: '1rem 0', order: 2 }}>
                <div
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px' }}
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    if (touchStartX.current === null) return;
                    const delta = e.changedTouches[0].clientX - touchStartX.current;
                    if (delta > 50) prevImg();
                    if (delta < -50) nextImg();
                    touchStartX.current = null;
                  }}
                >
                  <img src={images[imgIdx]} alt={`${product.name} - ${imgIdx + 1}. kép`} style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} aria-label="Előző kép" style={{ ...arrowStyle, left: 0 }}>
                        <ChevronLeft size={30} />
                      </button>
                      <button onClick={nextImg} aria-label="Következő kép" style={{ ...arrowStyle, right: 0 }}>
                        <ChevronRight size={30} />
                      </button>
                    </>
                  )}
                  {product.sale && product.sale.active && (
                    <span style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      backgroundColor: '#d32f2f', color: 'white',
                      padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                      {product.sale.label || 'AKCIÓ'}
                    </span>
                  )}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} aria-label={`${i + 1}. kép megnyitása`} style={{
                        padding: 0, border: i === imgIdx ? '2px solid #C9A961' : '2px solid #ddd',
                        borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white',
                        opacity: i === imgIdx ? 1 : 0.7, transition: 'all 0.2s'
                      }}>
                        <img src={img} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', display: 'block', borderRadius: '2px' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Részletek — infó-oszlop balra (LD-minta) */}
          <div style={{ padding: '1rem 0', order: 1 }}>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat?.name} → {subcat?.name}
            </p>
            <h1 style={{
              color: '#0F2A1D', margin: '0.5rem 0', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontFamily: 'Georgia, serif', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1
            }}>
              {product.name}
            </h1>
            {product.brand && product.brand !== 'Generic' && (
              <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
                Márka: <strong>{product.brand}</strong>
              </p>
            )}

            {/* Valódi értékelés-összesítő (csak ha van jóváhagyott vélemény) */}
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem' }}>
                <span style={{ color: '#FFB800', fontSize: '1.1rem' }}>
                  {'★'.repeat(Math.round(reviews.reduce((s, r) => s + r.stars, 0) / reviews.length))}
                </span>
                <span style={{ color: '#666' }}>
                  {(reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)} / 5
                  ({reviews.length} értékelés)
                </span>
              </div>
            )}

            {/* Leírás felül (LD-minta), az ár lejjebb, a CTA fölé kerül */}
            <p style={{ color: '#333', margin: '0 0 1.75rem 0', lineHeight: 1.65, fontSize: '0.95rem' }}>{product.description}</p>

            {/* Szín választás — LD "SELECT FLAVOR" minta: képes csempék névvel */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', marginBottom: '0.65rem', fontWeight: 700, color: '#0F2A1D',
                  textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.08em'
                }}>
                  Válassz színt
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.variants.map(v => (
                    <button key={v.code} disabled={v.stock === 0}
                      onClick={() => {
                        setSelectedColor(v.code);
                        setImgIdx(0);   // a galéria innentől csak ezt a színt mutatja
                      }}
                      style={{
                        width: '92px', padding: '0.5rem 0.35rem 0.6rem', borderRadius: 0,
                        border: selectedColor === v.code ? '2px solid #0F2A1D' : '1px solid #ddd',
                        backgroundColor: 'white', cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                        opacity: v.stock === 0 ? 0.4 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
                      }}>
                      <img src={v.image || product.image} alt={v.color} loading="lazy"
                        style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                      <span style={{
                        fontSize: '0.72rem', fontWeight: selectedColor === v.code ? 700 : 500,
                        color: '#0F2A1D', lineHeight: 1.2, textAlign: 'center'
                      }}>
                        {v.color}{v.stock > 0 && v.stock < 10 ? ` (${v.stock})` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (() => {
              // Méret-szintű készlet a kiválasztott színnél (ha a variáns mátrixot használ)
              const activeVariant = (product.variants || []).find(v => v.code === selectedColor)
                || ((product.variants || []).length === 1 ? product.variants[0] : null);
              const sizeStock = activeVariant && activeVariant.sizeStock ? activeVariant.sizeStock : null;
              // Csak a ténylegesen raktáron lévő méretek jelenjenek meg, vízszintes
              // elrendezésben — nem kitöltő, áthúzott "elfogyott" gombokkal. sizeStock
              // hiányában (nincs szín-szintű adat) minden méret látszik; a szűrés
              // minden render-nél élőben újraszámol, így készletváltozásra frissül.
              const visibleSizes = sizeStock ? product.sizes.filter(size => (sizeStock[size] || 0) > 0) : product.sizes;
              return (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{
                      fontWeight: 700, color: '#0F2A1D',
                      textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.08em'
                    }}>
                      Válassz méretet
                    </label>
                    {sizeChart && (
                      <button onClick={() => setShowSizeChart(true)} style={{
                        background: 'none', border: 'none', color: '#0F2A1D', cursor: 'pointer',
                        textDecoration: 'underline', fontSize: '0.88rem', padding: 0,
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <Ruler size={15} /> Mérettáblázat
                      </button>
                    )}
                  </div>
                  {visibleSizes.length === 0 ? (
                    <p style={{ color: '#c62828', fontSize: '0.85rem', margin: 0 }}>Ebből a színből minden méret elfogyott.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* LD "SELECT SIZE" minta: nagyobb dobozok, kövér méret-felirat,
                          alatta kis készlet-alcím, ha kevés van */}
                      {visibleSizes.map(size => (
                        <button key={size} onClick={() => setSelectedSize(size)}
                          style={{
                            minWidth: '64px', padding: '0.7rem 0.9rem', borderRadius: 0,
                            border: selectedSize === size ? '2px solid #0F2A1D' : '1px solid #ddd',
                            backgroundColor: 'white', color: '#0F2A1D', cursor: 'pointer',
                            fontWeight: 700, fontSize: '1.05rem', fontFamily: 'Georgia, serif'
                          }}>
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ár + mennyiség egy sorban, közvetlenül a CTA fölött (LD-minta) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', margin: '0 0 1rem 0' }}>
              <div>
                {product.sale && product.sale.active ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1rem', marginRight: '0.6rem' }}>
                      {product.price.toLocaleString('hu-HU')} Ft
                    </span>
                    <span style={{ color: '#d32f2f', fontSize: '1.9rem', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                      {product.sale.price.toLocaleString('hu-HU')} Ft
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#0F2A1D', fontSize: '1.9rem', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                    {product.price.toLocaleString('hu-HU')} Ft
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '42px', height: '42px', border: '1px solid #ddd', borderRight: 'none', borderRadius: 0, cursor: 'pointer', backgroundColor: 'white', fontSize: '1.1rem' }}>−</button>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '56px', height: '42px', padding: 0, border: '1px solid #ddd', borderRadius: 0, textAlign: 'center', boxSizing: 'border-box' }} />
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: '42px', height: '42px', border: '1px solid #ddd', borderLeft: 'none', borderRadius: 0, cursor: 'pointer', backgroundColor: 'white', fontSize: '1.1rem' }}>+</button>
                </div>
                {/* A kiválasztott méret elérhető darabszáma — a méret-gombokon nincs többé kiírva */}
                {(() => {
                  const av = (product.variants || []).find(v => v.code === selectedColor)
                    || ((product.variants || []).length === 1 ? product.variants[0] : null);
                  const q = av && av.sizeStock && selectedSize ? (av.sizeStock[selectedSize] || 0) : null;
                  return q !== null && q > 0 ? (
                    <span style={{ color: '#2e7d32', fontSize: '0.8rem' }}>{q} db raktáron</span>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Gombok — LD-minta: egymás alatt, teljes szélességű tömör CTA + körvonalas másodlagos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                style={{
                  width: '100%', padding: '1.05rem',
                  backgroundColor: product.stock === 0 ? '#ccc' : '#0F2A1D',
                  color: 'white', border: 'none', borderRadius: 0,
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                <ShoppingCart size={20} />
                {product.stock === 0 ? 'Elfogyott' : 'Kosárba'}
              </button>

              <button onClick={handleWishlist}
                title={wished ? 'Eltávolítás kedvencekből' : 'Kedvencekhez adás'}
                style={{
                  width: '100%', padding: '1rem',
                  backgroundColor: wished ? '#0F2A1D' : 'white',
                  color: wished ? 'white' : '#0F2A1D',
                  border: '2px solid #0F2A1D', borderRadius: 0, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                <Heart size={18} fill={wished ? 'white' : 'none'} />
                {wished ? 'Kedvencekben' : 'Kedvencekhez'}
              </button>
            </div>
            <details style={{ borderTop: '1px solid #e5e5e5' }}>
              <summary style={{
                cursor: 'pointer', padding: '0.9rem 0', fontWeight: 700, color: '#0F2A1D',
                textTransform: 'uppercase', fontSize: '0.88rem', letterSpacing: '0.04em', listStyle: 'none'
              }}>
                Szállítás, csere és visszaküldés
              </summary>
              <div style={{ color: '#444', margin: '0 0 1rem 0', lineHeight: 1.65, fontSize: '0.95rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>Kiszállítás 2-3 munkanapon belül országosan, 30 000 Ft felett ingyenesen.</p>
                <p style={{ margin: 0 }}>14 napon belül indoklás nélkül cserélheted vagy visszaküldheted a terméket.</p>
              </div>
            </details>

            {/* Garanciák */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e5e5', fontSize: '0.85rem', color: '#666' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Truck size={16} color="#0F2A1D" /> Gyors kiszállítás 2-3 munkanap
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={16} color="#0F2A1D" /> EU tanúsított termék
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="#0F2A1D" /> 14 napos visszavásárlási garancia
              </div>
            </div>
          </div>
        </div>

        {/* Vásárlói értékelések — Bazaarvoice-minta: bal oldalt csillag-eloszlás sávdiagram,
            középen nagy átlag, jobbra "Értékeld a terméket" csillagok; alatta rendezhető lista */}
        <div style={{ backgroundColor: 'white', borderRadius: 0, border: '1px solid #eee', padding: '1.75rem', marginTop: '2rem' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: 0, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.4rem' }}>Értékelések</h2>

          {(() => {
            const counts = [5, 4, 3, 2, 1].map(s => reviews.filter(r => r.stars === s).length);
            const maxCount = Math.max(...counts, 1);
            const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
            const shown = [...reviews]
              .filter(r => revFilterStars === null || r.stars === revFilterStars)
              .sort((a, b) => revSort === 'top' ? (b.stars - a.stars) : (new Date(b.ts) - new Date(a.ts)));
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                  {/* Csillag-eloszlás sávdiagram — sorra kattintva szűr */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#0F2A1D', margin: '0 0 0.35rem 0', fontSize: '0.92rem' }}>Értékelés-összegzés</p>
                    <p style={{ color: '#777', fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>Kattints egy sorra a szűréshez.</p>
                    {[5, 4, 3, 2, 1].map((s, i) => (
                      <button key={s} onClick={() => setRevFilterStars(revFilterStars === s ? null : s)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.22rem 0',
                        opacity: revFilterStars !== null && revFilterStars !== s ? 0.45 : 1
                      }}>
                        <span style={{ fontSize: '0.85rem', color: '#333', width: '64px', textAlign: 'left', whiteSpace: 'nowrap' }}>{s} csillag</span>
                        <span style={{ flex: 1, height: '12px', border: '1px solid #ddd', borderRadius: '999px', overflow: 'hidden', backgroundColor: 'white' }}>
                          <span style={{ display: 'block', height: '100%', width: `${(counts[i] / maxCount) * 100}%`, backgroundColor: '#C9A961' }} />
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#333', width: '24px', textAlign: 'right' }}>{counts[i]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Összesített értékelés — nagy átlagszám */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#0F2A1D', margin: '0 0 0.75rem 0', fontSize: '0.92rem' }}>Összesített értékelés</p>
                    {reviews.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 700, color: '#0F2A1D', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                          {avg.toFixed(1)}
                        </span>
                        <div>
                          <div style={{ color: '#C9A961', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
                            {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
                          </div>
                          <div style={{ color: '#666', fontSize: '0.85rem' }}>{reviews.length} értékelés</div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Még nincs értékelés — legyél te az első!</p>
                    )}
                  </div>

                  {/* Értékeld a terméket — csillag-dobozok, kattintásra kitölti az űrlapot */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#0F2A1D', margin: '0 0 0.75rem 0', fontSize: '0.92rem' }}>Értékeld a terméket</p>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRevForm({ ...revForm, stars: s })} aria-label={`${s} csillag`} style={{
                          width: '48px', height: '48px', border: '1px solid #ccc', borderRadius: 0,
                          backgroundColor: 'white', cursor: 'pointer', fontSize: '1.3rem',
                          color: s <= revForm.stars ? '#C9A961' : '#bbb'
                        }}>
                          {s <= revForm.stars ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <p style={{ color: '#777', fontSize: '0.8rem', margin: 0, lineHeight: 1.45 }}>
                      Az értékeléseket moderáljuk — jóváhagyás után jelennek meg.
                    </p>
                  </div>
                </div>

                {/* Rendezés-sor */}
                {reviews.length > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                    borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', padding: '0.85rem 0', marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: '#333', fontSize: '0.9rem' }}>
                      1–{shown.length} / {reviews.length} értékelés{revFilterStars !== null ? ` (${revFilterStars} csillagos szűrő)` : ''}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
                      Rendezés
                      <select value={revSort} onChange={e => setRevSort(e.target.value)}
                        style={{ padding: '0.45rem 0.6rem', border: '1px solid #ccc', borderRadius: 0, backgroundColor: 'white', fontSize: '0.88rem' }}>
                        <option value="top">Legjobb értékelés elöl</option>
                        <option value="new">Legújabb elöl</option>
                      </select>
                    </label>
                  </div>
                )}

                {/* Értékelés-lista: bal meta-oszlop + jobb tartalom (Bazaarvoice-elrendezés) */}
                {shown.map((r, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: 'minmax(120px, 180px) 1fr', gap: '1.25rem',
                    borderBottom: '1px solid #f0f0f0', padding: '1.1rem 0'
                  }}>
                    <div>
                      <strong style={{ color: '#0F2A1D', fontSize: '0.92rem', display: 'block' }}>{r.name}</strong>
                      <span style={{ color: '#999', fontSize: '0.78rem' }}>{new Date(r.ts).toLocaleDateString('hu-HU')}</span>
                    </div>
                    <div>
                      <div style={{ color: '#C9A961', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                        {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                      </div>
                      <p style={{ color: '#444', margin: 0, fontSize: '0.92rem', lineHeight: 1.6 }}>{r.text}</p>
                    </div>
                  </div>
                ))}
                {reviews.length > 0 && shown.length === 0 && (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Nincs a szűrőnek megfelelő értékelés.</p>
                )}
              </>
            );
          })()}

          {revSent ? (
            <p style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: '1rem' }}>
              ✔ Köszönjük! Az értékelésed jóváhagyás után jelenik meg.
            </p>
          ) : (
            <div style={{ marginTop: '1.25rem', backgroundColor: '#fafaf8', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ color: '#0F2A1D', marginTop: 0, fontSize: '1rem' }}>Írd meg a véleményed</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input type="text" placeholder="Neved" value={revForm.name}
                  onChange={e => setRevForm({ ...revForm, name: e.target.value })}
                  style={{ flex: 1, minWidth: '160px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                <select value={revForm.stars} onChange={e => setRevForm({ ...revForm, stars: parseInt(e.target.value, 10) })}
                  style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                  {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{'★'.repeat(s)} ({s})</option>)}
                </select>
              </div>
              <textarea placeholder="Milyen a termék? Méret, kényelem, tartósság…" value={revForm.text}
                onChange={e => setRevForm({ ...revForm, text: e.target.value })} rows={3}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={async () => {
                if (!revForm.name.trim() || !revForm.text.trim()) { alert('Kérlek, add meg a neved és a véleményed!'); return; }
                try {
                  await fetch('/.netlify/functions/reviews-api', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ op: 'submit', productId: product.id, ...revForm })
                  });
                } catch (e) {}
                setRevSent(true);
              }} style={{ marginTop: '0.6rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Értékelés beküldése
              </button>
              <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Az értékeléseket moderáljuk — jóváhagyás után jelennek meg.
              </p>
            </div>
          )}
        </div>

        {/* Kapcsolódó termékek */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ color: '#0F2A1D', marginBottom: '1.5rem' }}>📦 Hasonló termékek</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem'
            }}>
              {related.map(p => (
                <Link key={p.id} to={`/termek/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s'
                  }}>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '1rem' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '150px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ color: '#0F2A1D', fontSize: '0.9rem', minHeight: '2.6em' }}>{p.name}</h3>
                      <p style={{ color: '#C9A961', fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                        {((p.sale && p.sale.active) ? p.sale.price : p.price).toLocaleString('hu-HU')} Ft
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSizeChart && (
        <SizeChartModal chart={sizeChart} onClose={() => setShowSizeChart(false)} />
      )}
    </div>
  );
};

export default ProductDetailPage;
