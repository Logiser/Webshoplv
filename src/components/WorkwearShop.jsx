import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Search, Phone, Mail, MapPin, Lock, Truck, Shield, Award, ChevronRight, Home, Filter, Star, Heart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productCategories, productSubcategories } from '../data/productData';
import { getVisibleProducts, getAllBrands, getWishlist, toggleWishlist, getProductActivity } from '../data/storage';
import { trackAddToCart, trackAddToWishlist } from '../utils/analytics';

const WorkwearShop = () => {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
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
  const [minRating, setMinRating] = useState(0);

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
  }, []);

  const getEffectivePrice = (p) => (p.sale && p.sale.active) ? p.sale.price : p.price;

  // SEO
  useEffect(() => {
    document.title = 'MunkavédelmiShop - Munkaruházat és Munkavédelmi Felszerelés Webshop';

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
    setMeta('og:title', 'MunkavédelmiShop - Munkaruházat Webshop', true);
    setMeta('og:type', 'website', true);
    setMeta('og:locale', 'hu_HU', true);
  }, []);

  const allBrands = getAllBrands();
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes || []))).sort();

  // Szűrt termékek
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || p.subcategoryId === selectedSubcategory;
    const price = getEffectivePrice(p);
    const matchesPrice = price >= priceMin && price <= priceMax;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
    const matchesSize = selectedSizes.length === 0 || (p.sizes || []).some(s => selectedSizes.includes(s));
    const matchesRating = (p.rating || 0) >= minRating;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice && matchesBrand && matchesSize && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return getEffectivePrice(a) - getEffectivePrice(b);
    if (sortBy === 'price-desc') return getEffectivePrice(b) - getEffectivePrice(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
    setMinRating(0);
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Info Bar */}
      <div style={{
        backgroundColor: '#0a1f19', color: 'white', padding: '0.5rem 1.5rem', fontSize: '0.85rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Phone size={14} /> +36 30 272 2571
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Mail size={14} /> iroda@tuz-munkavedelmiszaki.hu
          </span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Truck size={14} /> Ingyenes szállítás 30.000 Ft felett
        </span>
      </div>

      {/* Header */}
      <header style={{
        backgroundColor: 'white', padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961', flexWrap: 'wrap', gap: '1rem'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Georgia, serif', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ MunkavédelmiShop
          </h1>
        </Link>

        <div style={{
          flex: 1, minWidth: '200px', maxWidth: '500px',
          display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5',
          borderRadius: '4px', padding: '0.25rem 0.5rem', border: '1px solid #ddd'
        }}>
          <Search size={20} style={{ color: '#999', marginRight: '0.5rem' }} />
          <input
            type="text" placeholder="Termékek keresése..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '0.5rem', fontSize: '0.95rem', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/wishlist" title="Kedvencek"
            style={{ padding: '0.6rem', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', position: 'relative', textDecoration: 'none', color: '#d32f2f', display: 'flex' }}>
            <Heart size={22} fill={wishlist.length > 0 ? '#d32f2f' : 'none'} />
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                backgroundColor: '#d32f2f', color: 'white', borderRadius: '50%',
                width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold'
              }}>{wishlist.length}</span>
            )}
          </Link>

          <button onClick={() => setCartOpen(!cartOpen)} style={{
            backgroundColor: '#C9A961', color: '#0F2A1D',
            padding: '0.75rem 1.25rem', borderRadius: '4px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative'
          }}>
            <ShoppingCart size={20} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.75rem' }}>Kosár</span>
              <span style={{ fontSize: '0.9rem' }}>{cartTotal.toLocaleString('hu-HU')} Ft</span>
            </span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                backgroundColor: '#d32f2f', color: 'white', borderRadius: '50%',
                width: '24px', height: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 'bold'
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Category Navigation */}
      <nav style={{
        backgroundColor: '#0F2A1D', padding: '0.5rem 1.5rem',
        position: 'sticky', top: '76px', zIndex: 99,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
          <button
            onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
            style={{
              padding: '0.5rem 1rem', border: 'none',
              backgroundColor: selectedCategory === null ? '#C9A961' : 'transparent',
              color: selectedCategory === null ? '#0F2A1D' : 'white',
              cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px',
              display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap'
            }}
          >
            <Home size={16} /> Összes
          </button>
          {productCategories.map(category => (
            <button
              key={category.id}
              onClick={() => { setSelectedCategory(category.id); setSelectedSubcategory(null); }}
              style={{
                padding: '0.5rem 1rem', border: 'none',
                backgroundColor: selectedCategory === category.id ? '#C9A961' : 'transparent',
                color: selectedCategory === category.id ? '#0F2A1D' : 'white',
                cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
          <Link to="/blog" style={{
            padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'bold',
            marginLeft: 'auto', whiteSpace: 'nowrap'
          }}>📝 Blog</Link>
        </div>
      </nav>

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, width: '100%', maxWidth: '450px',
            height: '100vh', backgroundColor: 'white',
            boxShadow: '-2px 0 16px rgba(0,0,0,0.2)', zIndex: 201,
            overflowY: 'auto', padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#0F2A1D', margin: 0 }}>🛒 Kosár</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

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
                      <p style={{ margin: 0, color: '#0F2A1D', fontWeight: 'bold' }}>
                        {item.quantity} × {item.price.toLocaleString('hu-HU')} Ft
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#C9A961', fontWeight: 'bold' }}>
                        = {(item.quantity * item.price).toLocaleString('hu-HU')} Ft
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
                        {cartTotal >= 30000 ? 'INGYENES' : '+1.990 Ft'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Összesen:</span>
                    <span style={{ color: '#C9A961' }}>
                      {(cartTotal + (cartTotal >= 30000 ? 0 : 1990)).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/checkout', { state: { cart, total: cartTotal + (cartTotal >= 30000 ? 0 : 1990) } });
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
        </>
      )}

      {/* Hero */}
      {!selectedCategory && !searchTerm && (
        <div style={{ background: 'linear-gradient(135deg, #0F2A1D 0%, #1a3f33 100%)', color: 'white', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
              Munkavédelmi Termékek Webshop
            </h2>
            <p style={{ fontSize: '1.1rem', margin: '0 0 2rem 0', opacity: 0.9, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
              Professzionális munkaruházat, biztonsági cipők és védőeszközök közvetlenül raktárról.
            </p>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={24} style={{ color: '#C9A961' }} /> <span>Gyors kiszállítás</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={24} style={{ color: '#C9A961' }} /> <span>Minőségi garancia</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={24} style={{ color: '#C9A961' }} /> <span>Tanúsított termékek</span>
              </div>
            </div>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '2rem'
        }}>

          {/* Sidebar with Filters */}
          <aside style={{
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: 'fit-content',
            position: 'sticky', top: '180px'
          }}>
            {/* Alkategóriák */}
            {selectedCategory && currentSubcategories.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #C9A961', paddingBottom: '0.5rem' }}>
                  <Filter size={18} /> Alkategóriák
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
                  <button onClick={() => setSelectedSubcategory(null)} style={{
                    padding: '0.5rem 0.75rem', border: 'none',
                    backgroundColor: selectedSubcategory === null ? '#0F2A1D' : 'transparent',
                    color: selectedSubcategory === null ? 'white' : '#333',
                    cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.9rem',
                    fontWeight: selectedSubcategory === null ? 'bold' : 'normal'
                  }}>
                    Mind ({products.filter(p => p.categoryId === selectedCategory).length})
                  </button>
                  {currentSubcategories.map(sub => {
                    const count = products.filter(p => p.subcategoryId === sub.id).length;
                    return (
                      <button key={sub.id} onClick={() => setSelectedSubcategory(sub.id)} style={{
                        padding: '0.5rem 0.75rem', border: 'none',
                        backgroundColor: selectedSubcategory === sub.id ? '#0F2A1D' : 'transparent',
                        color: selectedSubcategory === sub.id ? 'white' : '#333',
                        cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontSize: '0.9rem',
                        fontWeight: selectedSubcategory === sub.id ? 'bold' : 'normal'
                      }}>
                        {sub.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Ár szűrő */}
            <h3 style={{ color: '#0F2A1D', marginBottom: '0.75rem', fontSize: '1rem', borderBottom: '2px solid #C9A961', paddingBottom: '0.5rem' }}>
              💰 Ár
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="number" value={priceMin} onChange={e => setPriceMin(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '50%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  placeholder="Min" />
                <input type="number" value={priceMax} onChange={e => setPriceMax(Math.max(priceMin, parseInt(e.target.value) || 50000))}
                  style={{ width: '50%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  placeholder="Max" />
              </div>
              <input type="range" min="0" max="50000" step="1000" value={priceMax}
                onChange={e => setPriceMax(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#C9A961' }} />
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                {priceMin.toLocaleString('hu-HU')} - {priceMax.toLocaleString('hu-HU')} Ft
              </p>
            </div>

            {/* Márka szűrő */}
            {allBrands.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.75rem', fontSize: '1rem', borderBottom: '2px solid #C9A961', paddingBottom: '0.5rem' }}>
                  🏷️ Márka
                </h3>
                <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {allBrands.map(brand => (
                    <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={selectedBrands.includes(brand)}
                        onChange={() => toggleArrayItem(selectedBrands, setSelectedBrands, brand)} />
                      {brand}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Méret szűrő */}
            {allSizes.length > 0 && (
              <>
                <h3 style={{ color: '#0F2A1D', marginBottom: '0.75rem', fontSize: '1rem', borderBottom: '2px solid #C9A961', paddingBottom: '0.5rem' }}>
                  📏 Méret
                </h3>
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {allSizes.map(size => (
                    <button key={size}
                      onClick={() => toggleArrayItem(selectedSizes, setSelectedSizes, size)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: selectedSizes.includes(size) ? '#0F2A1D' : 'white',
                        color: selectedSizes.includes(size) ? 'white' : '#333',
                        border: '1px solid #ddd', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '0.8rem'
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Csillag szűrő */}
            <h3 style={{ color: '#0F2A1D', marginBottom: '0.75rem', fontSize: '1rem', borderBottom: '2px solid #C9A961', paddingBottom: '0.5rem' }}>
              ⭐ Értékelés
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {[4, 3, 2, 1, 0].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer' }}>
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
              🔄 Szűrők visszaállítása
            </button>
          </aside>

          {/* Termékek lista */}
          <div>
            <div style={{
              backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '8px',
              marginBottom: '1.5rem', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ color: '#0F2A1D', fontWeight: 'bold' }}>{sortedProducts.length} termék</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem', cursor: 'pointer' }}>
                <option value="default">Rendezés: Alapértelmezett</option>
                <option value="price-asc">Ár: növekvő</option>
                <option value="price-desc">Ár: csökkenő</option>
                <option value="name">Név szerint</option>
                <option value="rating">Értékelés szerint</option>
              </select>
            </div>

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
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem'
              }}>
                {sortedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => { setSelectedProduct(product); setSelectedSize(null); setSelectedColor(null); setQuantity(1); }}
                    onWishlist={(e) => handleWishlist(e, product.id)}
                    wished={wishlist.includes(product.id)}
                  />
                ))}
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

      {/* Trust Section */}
      <div style={{ backgroundColor: 'white', padding: '3rem 1.5rem', marginTop: '3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            <div>
              <Truck size={48} style={{ color: '#C9A961', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0' }}>Gyors Kiszállítás</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>2-3 munkanapon belül országosan</p>
            </div>
            <div>
              <Shield size={48} style={{ color: '#C9A961', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0' }}>Minőségi Garancia</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>EU tanúsított termékek</p>
            </div>
            <div>
              <Award size={48} style={{ color: '#C9A961', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0' }}>Szakértő Tanácsadás</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Szakértő segítség a választáshoz</p>
            </div>
            <div>
              <Phone size={48} style={{ color: '#C9A961', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0' }}>Ügyfélszolgálat</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>+36 30 272 2571</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0a1f19', color: '#bbb', padding: '3rem 1.5rem 1rem', fontSize: '0.9rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ color: 'white', marginTop: 0 }}>🛡️ MunkavédelmiShop</h4>
              <p style={{ lineHeight: 1.6 }}>
                Munkavédelmi ruházat, cipők és felszerelések közvetlenül raktárról.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0 }}>Kategóriák</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {productCategories.map(cat => (
                  <li key={cat.id} style={{ marginBottom: '0.5rem' }}>
                    <button onClick={() => { setSelectedCategory(cat.id); window.scrollTo(0, 0); }}
                      style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      {cat.icon} {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0 }}>Információ</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/blog" style={{ color: '#bbb', textDecoration: 'none' }}>📝 Blog</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/wishlist" style={{ color: '#bbb', textDecoration: 'none' }}>❤️ Kedvenceim</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/about" style={{ color: '#bbb', textDecoration: 'none' }}>Rólunk</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/shipping" style={{ color: '#bbb', textDecoration: 'none' }}>Szállítási feltételek</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/terms" style={{ color: '#bbb', textDecoration: 'none' }}>ÁSZF</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/privacy" style={{ color: '#bbb', textDecoration: 'none' }}>Adatvédelem</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/impressum" style={{ color: '#bbb', textDecoration: 'none' }}>Impresszum</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginTop: 0 }}>Kapcsolat</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Phone size={14} /> +36 30 272 2571
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Mail size={14} /> iroda@tuz-munkavedelmiszaki.hu
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} /> Szentes, Magyarország
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ margin: 0 }}>© 2024 MunkavédelmiShop - Minden jog fenntartva</p>
            <Link to="/admin-login" style={{ color: '#C9A961', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={12} /> Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// PRODUCT CARD
// ============================================================
const ProductCard = ({ product, onSelect, onWishlist, wished }) => {
  const [activity, setActivity] = useState({ activeViewers: 1, lastOrderTime: null });

  useEffect(() => {
    setActivity(getProductActivity(product.id));
  }, [product.id]);

  return (
    <div onClick={onSelect} style={{
      backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', position: 'relative'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
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

      <div style={{ position: 'relative', backgroundColor: '#f9f9f9', padding: '1rem' }}>
        <img src={product.image} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'contain' }} />
        {product.stock < 20 && product.stock > 0 && (
          <span style={{
            position: 'absolute', top: '0.5rem', left: '0.5rem',
            backgroundColor: '#FF9800', color: 'white',
            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
          }}>
            Utolsó {product.stock} db!
          </span>
        )}
        {product.sale && product.sale.active && (
          <span style={{
            position: 'absolute', top: product.stock < 20 ? '2.25rem' : '0.5rem', left: '0.5rem',
            backgroundColor: '#d32f2f', color: 'white',
            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
          }}>
            {product.sale.label || 'AKCIÓ'}
          </span>
        )}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ color: '#999', fontSize: '0.75rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
          {productCategories.find(c => c.id === product.categoryId)?.name}
        </p>

        <Link to={`/termek/${product.slug}`} onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', color: '#0F2A1D' }}>
          <h3 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 'bold', minHeight: '2.6em', lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>

        {/* Élő aktivitás */}
        {activity.activeViewers > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#FF9800', marginBottom: '0.5rem' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye size={10} /> {activity.activeViewers} ember nézi most
            </p>
          </div>
        )}

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
          ) : (
            <p style={{ color: '#C9A961', fontSize: '1.3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
              {product.price.toLocaleString('hu-HU')} Ft
            </p>
          )}
          <button onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{
            width: '100%', backgroundColor: '#0F2A1D', color: 'white',
            padding: '0.6rem', borderRadius: '4px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <ShoppingCart size={16} /> Kosárba
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
  const variants = product.variants || [];
  const activeVariant = variants.find(v => v.code === selectedColor) || (variants.length === 1 ? variants[0] : null);
  const displayImage = (activeVariant && activeVariant.image) || product.image;
  const displayStock = activeVariant ? activeVariant.stock : product.stock;
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
        <div style={{ padding: '2rem', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={displayImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
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

          <h2 style={{ color: '#0F2A1D', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{product.name}</h2>
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
            return (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>Méret:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {product.sizes.map(size => {
                    const qty = sizeStock ? (sizeStock[size] || 0) : null;
                    const out = qty !== null && qty === 0;
                    return (
                      <button key={size} onClick={() => !out && setSelectedSize(size)} disabled={out}
                        title={out ? 'Ebből a méretből elfogyott' : ''}
                        style={{
                          padding: '0.5rem', borderRadius: '4px',
                          border: `2px solid ${selectedSize === size ? '#0F2A1D' : '#ddd'}`,
                          backgroundColor: selectedSize === size ? '#0F2A1D' : 'white',
                          color: out ? '#bbb' : (selectedSize === size ? 'white' : '#0F2A1D'),
                          cursor: out ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                          textDecoration: out ? 'line-through' : 'none'
                        }}>{size}{qty !== null && qty > 0 && qty < 10 ? ` (${qty})` : ''}</button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>Mennyiség:</label>
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
            display: 'block', padding: '0.5rem', textAlign: 'center',
            color: '#0F2A1D', textDecoration: 'underline', fontSize: '0.85rem'
          }}>
            📄 Részletes termékoldal megnyitása →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkwearShop;
