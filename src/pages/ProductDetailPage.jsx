import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Heart, Truck, Shield, Award, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { productCategories, productSubcategories, getProductImages } from '../data/productData';
import { getProductBySlug, getVisibleProducts, toggleWishlist, isInWishlist, recordProductView, getProductActivity } from '../data/storage';
import { trackViewItem, trackAddToCart, trackAddToWishlist } from '../utils/analytics';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState([]);
  const [wished, setWished] = useState(false);
  const [activity, setActivity] = useState({ activeViewers: 1 });
  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    const p = getProductBySlug(slug);
    if (!p) {
      navigate('/');
      return;
    }
    setProduct(p);
    setImgIdx(0);
    setWished(isInWishlist(p.id));
    recordProductView(p.id);
    setActivity(getProductActivity(p.id));
    trackViewItem(p);  // GA4 + FB Pixel

    // Kapcsolódó termékek (azonos alkategória)
    const allVisible = getVisibleProducts();
    setRelated(allVisible.filter(prod => prod.subcategoryId === p.subcategoryId && prod.id !== p.id).slice(0, 4));

    // SEO meta tagok
    const cat = productCategories.find(c => c.id === p.categoryId);
    document.title = `${p.name} | MunkavédelmiShop`;

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

    const desc = p.description ? p.description.substring(0, 160) : `${p.name} - ${cat?.name || ''} - MunkavédelmiShop webshopjából`;
    setMeta('description', desc);
    setMeta('keywords', `${p.name}, ${p.brand || ''}, ${cat?.name || ''}, munkavédelem`);
    setMeta('og:title', p.name, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', p.image, true);
    setMeta('og:type', 'product', true);

    // Schema.org Product markup
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.name,
      "image": p.image,
      "description": p.description,
      "brand": { "@type": "Brand", "name": p.brand || 'MunkavédelmiShop' },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "HUF",
        "price": (p.sale && p.sale.active) ? p.sale.price : p.price,
        "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      },
      "aggregateRating": p.rating ? {
        "@type": "AggregateRating",
        "ratingValue": p.rating,
        "reviewCount": Math.floor(Math.random() * 50) + 10
      } : undefined
    };

    let schemaScript = document.querySelector('script[type="application/ld+json"][data-product]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-product', 'true');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);

    return () => {
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [slug, navigate]);

  // Aktivitás frissítés 30 mp-ként
  useEffect(() => {
    if (!product) return;
    const interval = setInterval(() => {
      setActivity(getProductActivity(product.id));
    }, 30000);
    return () => clearInterval(interval);
  }, [product]);

  if (!product) return null;

  const cat = productCategories.find(c => c.id === product.categoryId);
  const subcat = productSubcategories.find(s => s.id === product.subcategoryId);
  const effectivePrice = (product.sale && product.sale.active) ? product.sale.price : product.price;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Kérjük, válassz méretet!');
      return;
    }
    // Beletesszük a kosárba (sessionStorage-en keresztül a főoldal kosarához)
    const cartData = JSON.parse(sessionStorage.getItem('temp_cart') || '[]');
    cartData.push({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      quantity,
      size: selectedSize,
      image: product.image
    });
    sessionStorage.setItem('temp_cart', JSON.stringify(cartData));
    trackAddToCart(product, quantity);  // GA4 + FB Pixel
    alert(`✅ ${product.name} kosárba téve!`);
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    if (!wished) trackAddToWishlist(product);  // GA4 + FB Pixel
    setWished(!wished);
  };

  // Utolsó rendelés idő szövegezve - eltávolítva

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <header style={{
        backgroundColor: 'white', padding: '1rem 1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
            🛡️ MunkavédelmiShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
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
        
        {/* Termék részletek */}
        <div style={{ 
          backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', overflow: 'hidden'
        }}>
          
          {/* Kép galéria */}
          {(() => {
            const images = getProductImages(product);
            const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
            const nextImg = () => setImgIdx(i => (i + 1) % images.length);
            const arrowStyle = {
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'rgba(15,42,29,0.75)', color: 'white', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
            };
            return (
              <div style={{ padding: '2rem', backgroundColor: '#f9f9f9' }}>
                <div
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    if (touchStartX.current === null) return;
                    const delta = e.changedTouches[0].clientX - touchStartX.current;
                    if (delta > 50) prevImg();
                    if (delta < -50) nextImg();
                    touchStartX.current = null;
                  }}
                >
                  <img src={images[imgIdx]} alt={`${product.name} - ${imgIdx + 1}. kép`} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} aria-label="Előző kép" style={{ ...arrowStyle, left: '0.5rem' }}>
                        <ChevronLeft size={22} />
                      </button>
                      <button onClick={nextImg} aria-label="Következő kép" style={{ ...arrowStyle, right: '0.5rem' }}>
                        <ChevronRight size={22} />
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

          {/* Részletek */}
          <div style={{ padding: '2rem' }}>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase' }}>
              {cat?.name} → {subcat?.name}
            </p>
            <h1 style={{ color: '#0F2A1D', margin: '0.5rem 0', fontSize: '1.75rem' }}>
              {product.name}
            </h1>
            {product.brand && product.brand !== 'Generic' && (
              <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
                Márka: <strong>{product.brand}</strong>
              </p>
            )}

            <p style={{ color: '#444', marginBottom: '1.5rem', lineHeight: 1.6 }}>{product.description}</p>

            {/* Élő aktivitás */}
            <div style={{ 
              backgroundColor: '#fff9e6', padding: '0.75rem 1rem', borderRadius: '4px',
              borderLeft: '4px solid #FF9800', marginBottom: '1rem', fontSize: '0.9rem'
            }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={14} color="#FF9800" />
                <strong>{activity.activeViewers} ember</strong> nézi most ezt a terméket
              </p>
            </div>

            {/* Ár */}
            <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', borderLeft: '4px solid #C9A961' }}>
              {product.sale && product.sale.active ? (
                <>
                  <p style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.1rem', margin: 0 }}>
                    {product.price.toLocaleString('hu-HU')} Ft
                  </p>
                  <p style={{ color: '#d32f2f', fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                    {product.sale.price.toLocaleString('hu-HU')} Ft
                  </p>
                </>
              ) : (
                <p style={{ color: '#C9A961', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {product.price.toLocaleString('hu-HU')} Ft
                </p>
              )}
              <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                📦 Raktáron: <strong style={{ color: product.stock < 20 ? '#FF9800' : '#4CAF50' }}>{product.stock} db</strong>
                {product.stock < 20 && product.stock > 0 && <span style={{ color: '#FF9800', marginLeft: '0.5rem' }}>(kifutó!)</span>}
              </p>
            </div>

            {/* Méret választás */}
            {product.sizes && product.sizes.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Méret:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '0.5rem', borderRadius: '4px',
                        border: `2px solid ${selectedSize === size ? '#0F2A1D' : '#ddd'}`,
                        backgroundColor: selectedSize === size ? '#0F2A1D' : 'white',
                        color: selectedSize === size ? 'white' : '#0F2A1D',
                        cursor: 'pointer', fontWeight: 'bold'
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mennyiség */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                Mennyiség:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '40px', height: '40px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}>−</button>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '80px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }} />
                <button onClick={() => setQuantity(quantity + 1)} style={{ width: '40px', height: '40px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}>+</button>
              </div>
            </div>

            {/* Gombok */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                style={{
                  flex: 1, padding: '1rem',
                  backgroundColor: product.stock === 0 ? '#ccc' : '#C9A961',
                  color: '#0F2A1D', border: 'none', borderRadius: '4px',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: '1.05rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                <ShoppingCart size={20} />
                {product.stock === 0 ? 'Elfogyott' : 'Kosárba'}
              </button>

              <button onClick={handleWishlist}
                title={wished ? 'Eltávolítás kedvencekből' : 'Kedvencekhez adás'}
                style={{
                  padding: '1rem',
                  backgroundColor: wished ? '#d32f2f' : 'white',
                  color: wished ? 'white' : '#d32f2f',
                  border: `2px solid #d32f2f`, borderRadius: '4px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <Heart size={20} fill={wished ? 'white' : 'none'} />
              </button>
            </div>

            {/* Garanciák */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#666' }}>
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
    </div>
  );
};

export default ProductDetailPage;
