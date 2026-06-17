import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import WorkwearShop from './components/WorkwearShop';
import AdminPanel from './pages/AdminPanel';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import { TermsPage, PrivacyPage, ImpressumPage, ShippingPage, ContactPage, AboutPage } from './pages/StaticPages';
import { Lock } from 'lucide-react';
import { initAnalytics, trackPageView } from './utils/analytics';

// Route változás követése GA4 + FB Pixel számára
const RouteTracker = () => {
  const location = useLocation();
  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  return null;
};

function App() {
  const [adminPassword, setAdminPassword] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');

  React.useEffect(() => {
    // Admin jelszó beállítása (development: admin123)
    setAdminPassword(process.env.REACT_APP_ADMIN_PASSWORD || 'admin123');
    // Analytics indítás
    initAnalytics();
  }, []);

  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        {/* Admin Login */}
        <Route path="/admin-login" element={
          <div style={{
            backgroundColor: '#fafaf8',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{
                color: '#0F2A1D',
                textAlign: 'center',
                marginTop: 0,
                fontSize: '1.5rem'
              }}>
                <Lock style={{ display: 'inline', marginRight: '0.5rem' }} />
                Admin Bejelentkezés
              </h1>

              <input
                type="password"
                placeholder="Jelszó"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (passwordInput === adminPassword) {
                      sessionStorage.setItem('admin_logged_in', 'true');
                      window.location.href = '/admin';
                    } else {
                      alert('Hibás jelszó!');
                      setPasswordInput('');
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <button
                onClick={() => {
                  if (passwordInput === adminPassword) {
                    sessionStorage.setItem('admin_logged_in', 'true');
                    window.location.href = '/admin';
                  } else {
                    alert('Hibás jelszó!');
                    setPasswordInput('');
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0F2A1D',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Bejelentkezés
              </button>

              <p style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '0.9rem',
                marginTop: '1rem'
              }}>
                <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>
                  ← Vissza a főoldalra
                </Link>
              </p>
            </div>
          </div>
        } />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Statikus oldalak */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Új v6.0 route-ok */}
        <Route path="/termek/:slug" element={<ProductDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Főoldal */}
        <Route path="/" element={<WorkwearShop />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
