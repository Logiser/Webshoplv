import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Package, TrendingUp, Tag, Plus, Upload, Download, Search,
  Edit2, Trash2, Eye, EyeOff, AlertTriangle, DollarSign, Box, ShoppingBag,
  X, BarChart3, LogOut, Save, RefreshCw, Bell, FileText, CheckSquare,
  BookOpen, Mail, Printer
} from 'lucide-react';
import { productCategories, productSubcategories } from '../data/productData';
import {
  getAllProducts, updateProduct, addCustomProduct, addCustomProductsBatch,
  deleteCustomProduct, resetProductOverride, setProductSale, removeProductSale,
  addStockBatch, getStockHistory, getProductFIFOBatches, getStatistics,
  parseCSV, parseXML, exportToCSV, cleanExpiredSales, getOrders,
  updateOrderStatus, ORDER_STATUSES, getSalesReport, bulkUpdateProducts,
  getSupplierNotifications, removeSupplierNotification,
  getBlogPosts, saveBlogPost, deleteBlogPost, generateGoogleShoppingFeed,
  getCoupons, saveCoupon, deleteCoupon
} from '../data/storage';
import { openInvoice } from '../utils/invoice';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Auth ellenőrzés
  useEffect(() => {
    if (sessionStorage.getItem('admin_logged_in') !== 'true') {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('ms_admin_pw');
    navigate('/');
  };

  const tabs = [
    { id: 'dashboard', name: 'Áttekintés', icon: Home },
    { id: 'products', name: 'Termékek', icon: Package },
    { id: 'stock', name: 'FIFO Készlet', icon: Box },
    { id: 'sales', name: 'Akciók', icon: Tag },
    { id: 'add', name: 'Új Termék', icon: Plus },
    { id: 'import', name: 'CSV/XML Import', icon: Upload },
    { id: 'orders', name: 'Rendelések', icon: ShoppingBag },
    { id: 'coupons', name: 'Kuponok', icon: Tag },
    { id: 'reports', name: 'Riportok', icon: BarChart3 },
    { id: 'supplier', name: 'Beszállító ⓘ', icon: Bell },
    { id: 'blog', name: 'Blog', icon: BookOpen },
    { id: 'seo', name: 'SEO Eszközök', icon: FileText }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0F2A1D',
        color: 'white',
        padding: '1.5rem 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid #1a3f33' }}>
          <h2 style={{ margin: 0, color: '#C9A961', fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>
            🛡️ Admin Panel
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
            MunkavédelmiShop
          </p>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#1a3f33' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderLeft: activeTab === tab.id ? '4px solid #C9A961' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1a3f33' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#bbb',
              border: '1px solid #1a3f33',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Eye size={14} /> Webshop megnyitása
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={14} /> Kijelentkezés
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        {activeTab === 'dashboard' && <Dashboard key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'products' && <ProductsManager key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'stock' && <StockManager key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'sales' && <SalesManager key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'add' && <AddProduct onChange={triggerRefresh} setTab={setActiveTab} />}
        {activeTab === 'import' && <ImportProducts onChange={triggerRefresh} setTab={setActiveTab} />}
        {activeTab === 'orders' && <OrdersList key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'coupons' && <CouponsManager key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'reports' && <ReportsTab key={refreshKey} />}
        {activeTab === 'supplier' && <SupplierTab key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'blog' && <BlogManager key={refreshKey} onChange={triggerRefresh} />}
        {activeTab === 'seo' && <SeoTools key={refreshKey} />}
      </main>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const Dashboard = ({ onChange }) => {
  const stats = getStatistics();
  
  // Lejárt akciók takarítása
  useEffect(() => {
    const cleaned = cleanExpiredSales();
    if (cleaned > 0) {
      console.log(`${cleaned} lejárt akció eltávolítva`);
      onChange();
    }
  }, [onChange]);

  const StatCard = ({ icon: Icon, title, value, color, subtitle, badge }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#666', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase' }}>{title}</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#0F2A1D' }}>{value}</p>
          {subtitle && <p style={{ color: '#999', margin: 0, fontSize: '0.8rem' }}>{subtitle}</p>}
        </div>
        <div style={{ 
          backgroundColor: color + '20', 
          padding: '0.75rem', 
          borderRadius: '8px',
          color: color
        }}>
          <Icon size={24} />
        </div>
      </div>
      {badge && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          backgroundColor: color,
          color: 'white',
          padding: '0.15rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 'bold'
        }}>{badge}</div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0F2A1D' }}>📊 Áttekintés</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>Webshop statisztikák és gyors mutatók</p>
        </div>
        <button onClick={onChange} style={{
          padding: '0.5rem 1rem', backgroundColor: '#0F2A1D', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <RefreshCw size={16} /> Frissítés
        </button>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard icon={Package} title="Összes termék" value={stats.totalProducts} color="#0F2A1D"
          subtitle={`${stats.customProductCount} egyedi termék`} />
        <StatCard icon={Eye} title="Látható termékek" value={stats.visibleProducts} color="#4CAF50"
          subtitle={stats.hiddenProducts > 0 ? `${stats.hiddenProducts} rejtett` : 'Mind látható'} />
        <StatCard icon={Tag} title="Akciós termékek" value={stats.onSaleCount} color="#C9A961"
          subtitle="Aktív akciók" />
        <StatCard icon={DollarSign} title="Készlet érték" value={`${(stats.totalStockValue / 1000).toFixed(0)}K Ft`} color="#2196F3"
          subtitle={`Teljes raktárkészlet`} />
        <StatCard icon={AlertTriangle} title="Alacsony készlet" value={stats.lowStockCount} color="#FF9800"
          subtitle="< 20 db" badge={stats.lowStockCount > 0 ? '!' : null} />
        <StatCard icon={X} title="Elfogyott" value={stats.outOfStockCount} color="#d32f2f"
          subtitle="0 készlet" badge={stats.outOfStockCount > 0 ? '!' : null} />
        <StatCard icon={ShoppingBag} title="Rendelések" value={stats.totalOrders} color="#9C27B0"
          subtitle={`${(stats.totalRevenue / 1000).toFixed(0)}K Ft bevétel`} />
        <StatCard icon={TrendingUp} title="Bevétel" value={`${(stats.totalRevenue / 1000).toFixed(1)}K Ft`} color="#00897B"
          subtitle="Összes rendelésből" />
      </div>

      {/* Kategória + Figyelmeztetések */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Kategóriák */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} /> Kategóriánkénti bontás
          </h3>
          {productCategories.map(cat => {
            const stat = stats.byCategory[cat.id] || { count: 0, totalStock: 0, value: 0 };
            const maxCount = Math.max(...Object.values(stats.byCategory).map(s => s.count), 1);
            const widthPercent = (stat.count / maxCount) * 100;
            return (
              <div key={cat.id} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <span><strong>{cat.icon} {cat.name}</strong></span>
                  <span style={{ color: '#666' }}>{stat.count} termék • {stat.totalStock} db • {(stat.value / 1000).toFixed(0)}K Ft</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: widthPercent + '%',
                    height: '100%',
                    backgroundColor: '#C9A961',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Figyelmeztetések */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#FF9800" /> Figyelmeztetések
          </h3>

          {stats.outOfStockProducts.length === 0 && stats.lowStockProducts.length === 0 && (
            <p style={{ color: '#4CAF50', fontSize: '0.9rem' }}>✅ Minden rendben! Nincs készletprobléma.</p>
          )}

          {stats.outOfStockProducts.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                🔴 Elfogyott termékek ({stats.outOfStockProducts.length})
              </p>
              {stats.outOfStockProducts.slice(0, 5).map(p => (
                <div key={p.id} style={{ fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #f0f0f0' }}>
                  {p.name}
                </div>
              ))}
              {stats.outOfStockProducts.length > 5 && (
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  ... és {stats.outOfStockProducts.length - 5} további
                </p>
              )}
            </div>
          )}

          {stats.lowStockProducts.length > 0 && (
            <div>
              <p style={{ color: '#FF9800', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                🟠 Alacsony készlet ({stats.lowStockProducts.length})
              </p>
              {stats.lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} style={{ fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span>
                  <span style={{ color: '#FF9800', fontWeight: 'bold' }}>{p.stock} db</span>
                </div>
              ))}
              {stats.lowStockProducts.length > 5 && (
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  ... és {stats.lowStockProducts.length - 5} további
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top termékek */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>💰 Top 5 legdrágább termék</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666' }}>#</th>
              <th style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666' }}>Termék</th>
              <th style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666' }}>Kategória</th>
              <th style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>Ár</th>
              <th style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>Készlet</th>
            </tr>
          </thead>
          <tbody>
            {stats.top5Expensive.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '0.75rem 0.5rem', color: '#999' }}>{i + 1}</td>
                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: '#666', fontSize: '0.85rem' }}>
                  {productCategories.find(c => c.id === p.categoryId)?.name}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#C9A961', fontWeight: 'bold' }}>
                  {p.price.toLocaleString('hu-HU')} Ft
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{p.stock || 0} db</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// PRODUCTS MANAGER
// ============================================================
const ProductsManager = ({ onChange }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [selected, setSelected] = useState([]);

  const allProducts = getAllProducts();

  const filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || p.categoryId === filterCategory;
    const matchesStatus = filterStatus === 'all'
      || (filterStatus === 'visible' && !p.hidden)
      || (filterStatus === 'hidden' && p.hidden)
      || (filterStatus === 'sale' && p.sale && p.sale.active)
      || (filterStatus === 'low' && p.stock > 0 && p.stock < 20)
      || (filterStatus === 'out' && p.stock === 0)
      || (filterStatus === 'custom' && p.isCustom);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(p => p.id));
  };

  const handleBulkHide = () => {
    if (selected.length === 0 || !window.confirm(`Elrejtesz ${selected.length} terméket?`)) return;
    bulkUpdateProducts(selected, { hidden: true });
    setSelected([]);
    onChange();
  };

  const handleBulkShow = () => {
    if (selected.length === 0) return;
    bulkUpdateProducts(selected, { hidden: false });
    setSelected([]);
    onChange();
  };

  const handleBulkSale = () => {
    if (selected.length === 0) return;
    const pctStr = prompt(`${selected.length} termékre akciót teszünk. Add meg a kedvezmény százalékát (pl. 20):`);
    if (!pctStr) return;
    const pct = parseFloat(pctStr);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      alert('Hibás százalék!');
      return;
    }
    const label = prompt('Címke (pl. "AKCIÓ", "-20%"):', `-${pct}%`) || `-${pct}%`;
    selected.forEach(id => {
      const p = allProducts.find(prod => prod.id === id);
      if (p) {
        const salePrice = Math.round(p.price * (1 - pct / 100));
        setProductSale(id, salePrice, label, null);
      }
    });
    setSelected([]);
    onChange();
    alert(`✅ ${selected.length} termékre akció kiírva!`);
  };

  const handleBulkRemoveSale = () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Eltávolítod az akciókat ${selected.length} termékről?`)) return;
    selected.forEach(id => removeProductSale(id));
    setSelected([]);
    onChange();
  };

  const handleBulkChangeCategory = () => {
    if (selected.length === 0) return;
    const newCat = prompt('Új kategória ID (' + productCategories.map(c => c.id).join(', ') + '):');
    if (!newCat || !productCategories.find(c => c.id === newCat)) {
      alert('Hibás kategória ID!');
      return;
    }
    bulkUpdateProducts(selected, { categoryId: newCat });
    setSelected([]);
    onChange();
    alert(`✅ ${selected.length} termék új kategóriában!`);
  };

  const handleToggleHidden = (product) => {
    updateProduct(product.id, { hidden: !product.hidden });
    onChange();
  };

  const handleDelete = (product) => {
    if (!product.isCustom) {
      alert('Alaptermékek nem törölhetők, csak elrejthetők. Használd a "Megjelenítés/Elrejtés" gombot!');
      return;
    }
    if (window.confirm(`Biztosan törlöd: "${product.name}"?`)) {
      deleteCustomProduct(product.id);
      onChange();
    }
  };

  const handleResetOverride = (product) => {
    if (window.confirm(`Visszaállítod alapra: "${product.name}"?`)) {
      resetProductOverride(product.id);
      onChange();
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>📦 Termékek kezelése</h1>

      {/* Filters */}
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px', border: '1px solid #ddd', padding: '0.5rem', borderRadius: '4px' }}>
          <Search size={16} color="#999" />
          <input type="text" placeholder="Keresés..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem' }} />
        </div>

        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px' }}>
          <option value="">Összes kategória</option>
          {productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px' }}>
          <option value="all">Minden státusz</option>
          <option value="visible">Csak látható</option>
          <option value="hidden">Csak rejtett</option>
          <option value="sale">Csak akciós</option>
          <option value="low">Alacsony készlet</option>
          <option value="out">Elfogyott</option>
          <option value="custom">Csak egyedi termékek</option>
        </select>

        <button onClick={() => {
          const csv = exportToCSV();
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `termekek-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
        }} style={{ padding: '0.6rem 1rem', backgroundColor: '#C9A961', color: '#0F2A1D', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={16} /> CSV Export
        </button>
      </div>

      <p style={{ color: '#666', marginBottom: '1rem' }}>
        <strong>{filtered.length}</strong> termék megjelenítve
      </p>

      {/* Bulk actions sáv */}
      {selected.length > 0 && (
        <div style={{
          backgroundColor: '#0F2A1D', color: 'white', padding: '0.75rem 1rem',
          borderRadius: '8px', marginBottom: '1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <span style={{ fontWeight: 'bold' }}>
            <CheckSquare size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selected.length} termék kijelölve
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={handleBulkSale} style={bulkBtnStyle('#d32f2f')}>🏷️ Akció kiírás</button>
            <button onClick={handleBulkRemoveSale} style={bulkBtnStyle('#FF9800')}>🚫 Akció törlés</button>
            <button onClick={handleBulkHide} style={bulkBtnStyle('#666')}>👁️‍🗨️ Elrejtés</button>
            <button onClick={handleBulkShow} style={bulkBtnStyle('#4CAF50')}>👁️ Megjelenítés</button>
            <button onClick={handleBulkChangeCategory} style={bulkBtnStyle('#9C27B0')}>📂 Kategória</button>
            <button onClick={() => setSelected([])} style={bulkBtnStyle('#999')}>✕ Mégse</button>
          </div>
        </div>
      )}

      {/* Termékek lista */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', width: '30px' }}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll} title="Mind kijelölve" />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>Kép</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>Név</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>Kategória</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>Ár</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>Készlet</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>Státusz</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #eee', opacity: p.hidden ? 0.5 : 1, backgroundColor: selected.includes(p.id) ? '#fffbe6' : 'transparent' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                    <strong>{p.name}</strong>
                    {p.isCustom && <span style={{ display: 'inline-block', marginLeft: '0.5rem', padding: '0.1rem 0.4rem', backgroundColor: '#9C27B0', color: 'white', borderRadius: '4px', fontSize: '0.7rem' }}>EGYEDI</span>}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                    {productCategories.find(c => c.id === p.categoryId)?.name || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {p.sale && p.sale.active ? (
                      <>
                        <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                          {p.price.toLocaleString('hu-HU')}
                        </div>
                        <div style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                          {p.sale.price.toLocaleString('hu-HU')} Ft
                        </div>
                      </>
                    ) : (
                      <span style={{ fontWeight: 'bold', color: '#C9A961' }}>
                        {p.price.toLocaleString('hu-HU')} Ft
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span style={{
                      color: p.stock === 0 ? '#d32f2f' : p.stock < 20 ? '#FF9800' : '#4CAF50',
                      fontWeight: 'bold'
                    }}>
                      {p.stock || 0} db
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {p.hidden && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#666', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>REJTVE</span>}
                    {!p.hidden && p.sale && p.sale.active && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#d32f2f', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>{p.sale.label || 'AKCIÓ'}</span>}
                    {!p.hidden && !p.sale && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#4CAF50', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>AKTÍV</span>}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button onClick={() => setEditingProduct(p)} title="Szerkesztés" style={iconBtnStyle('#2196F3')}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggleHidden(p)} title={p.hidden ? 'Megjelenítés' : 'Elrejtés'} style={iconBtnStyle('#FF9800')}>
                      {p.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    {!p.isCustom && (
                      <button onClick={() => handleResetOverride(p)} title="Visszaállítás alapra" style={iconBtnStyle('#999')}>
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {p.isCustom && (
                      <button onClick={() => handleDelete(p)} title="Törlés" style={iconBtnStyle('#d32f2f')}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={() => { onChange(); setEditingProduct(null); }}
        />
      )}
    </div>
  );
};

const iconBtnStyle = (color) => ({
  padding: '0.3rem',
  marginLeft: '0.25rem',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center'
});

const bulkBtnStyle = (color) => ({
  padding: '0.4rem 0.75rem',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.8rem'
});

// ============================================================
// VARIÁNS SZERKESZTŐ (szín + kép + készlet, opcionális méret-mátrix)
// ============================================================
const VariantsEditor = ({ variants, onChange, sizes }) => {
  const rows = variants || [];

  const updateRow = (idx, updates) => {
    const next = rows.map((v, i) => i === idx ? { ...v, ...updates } : v);
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, { code: '', color: '', image: '', stock: 0 }]);
  };

  const removeRow = (idx) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  const toggleSizeStock = (idx) => {
    const v = rows[idx];
    if (v.sizeStock) {
      // Mátrix kikapcsolása: az összeg marad a variáns készlete
      const total = Object.values(v.sizeStock).reduce((s, n) => s + (parseInt(n) || 0), 0);
      onChange(rows.map((row, i) => {
        if (i !== idx) return row;
        const { sizeStock, ...rest } = row;
        return { ...rest, stock: total };
      }));
    } else {
      // Bekapcsolás: a jelenlegi készlet egyenletes elosztása a méretek között
      const sizeStock = {};
      const per = sizes.length > 0 ? Math.floor((v.stock || 0) / sizes.length) : 0;
      sizes.forEach((s, i) => { sizeStock[s] = per + (i < (v.stock || 0) % sizes.length ? 1 : 0); });
      updateRow(idx, { sizeStock });
    }
  };

  const setSizeQty = (idx, size, qty) => {
    const v = rows[idx];
    const sizeStock = { ...(v.sizeStock || {}), [size]: Math.max(0, parseInt(qty) || 0) };
    const total = Object.values(sizeStock).reduce((s, n) => s + (parseInt(n) || 0), 0);
    updateRow(idx, { sizeStock, stock: total });
  };

  const smallInput = { padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box' };

  return (
    <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '0.75rem', backgroundColor: '#fafaf8' }}>
      {rows.length === 0 && (
        <p style={{ color: '#999', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
          Nincs színvariáns — a termék szín nélkül, a fő képpel jelenik meg.
        </p>
      )}
      {rows.map((v, idx) => (
        <div key={idx} style={{ borderBottom: idx < rows.length - 1 ? '1px solid #eee' : 'none', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 80px 32px', gap: '0.5rem', alignItems: 'center' }}>
            <input style={{ ...smallInput, textTransform: 'uppercase' }} placeholder="KÓD" value={v.code}
              onChange={e => updateRow(idx, { code: e.target.value.toUpperCase() })} title="Színkód (pl. BK)" />
            <input style={smallInput} placeholder="Színnév (pl. Fekete)" value={v.color}
              onChange={e => updateRow(idx, { color: e.target.value })} />
            <input style={smallInput} placeholder="/images/products/xxx_bk.webp" value={v.image}
              onChange={e => updateRow(idx, { image: e.target.value })} />
            <input style={smallInput} type="number" min="0" placeholder="db" value={v.stock}
              disabled={!!v.sizeStock} title={v.sizeStock ? 'A méretenkénti készletek összege' : 'Készlet (db)'}
              onChange={e => updateRow(idx, { stock: Math.max(0, parseInt(e.target.value) || 0) })} />
            <button onClick={() => removeRow(idx)} title="Szín törlése" style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
              <Trash2 size={16} />
            </button>
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#666', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!v.sizeStock} onChange={() => toggleSizeStock(idx)} disabled={sizes.length === 0}
                style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Méretenkénti készlet {sizes.length === 0 ? '(előbb adj meg méreteket)' : ''}
            </label>
            {v.sizeStock && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {sizes.map(s => (
                  <div key={s} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>{s}</div>
                    <input type="number" min="0" value={v.sizeStock[s] !== undefined ? v.sizeStock[s] : 0}
                      onChange={e => setSizeQty(idx, s, e.target.value)}
                      style={{ ...smallInput, width: '52px', textAlign: 'center' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <button onClick={addRow} style={{
        padding: '0.4rem 0.75rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
        borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold'
      }}>
        + Új szín
      </button>
    </div>
  );
};

// ============================================================
// EDIT PRODUCT MODAL
// ============================================================
const EditProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price,
    description: product.description,
    stock: product.stock || 0,
    image: product.image,
    rating: product.rating || 4.5,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    sizes: (product.sizes || []).join(', ')
  });
  const [variants, setVariants] = useState(product.variants || []);

  const sizesArr = form.sizes.split(',').map(s => s.trim()).filter(Boolean);

  const handleSave = () => {
    if (!form.name || !form.price) {
      alert('Név és ár kötelező!');
      return;
    }
    const cleanVariants = variants.filter(v => v.code && v.color);
    if (variants.length > 0 && cleanVariants.length < variants.length) {
      alert('Minden színvariánsnál kötelező a KÓD és a színnév!');
      return;
    }
    const codes = cleanVariants.map(v => v.code);
    if (new Set(codes).size !== codes.length) {
      alert('A színkódok nem ismétlődhetnek!');
      return;
    }
    // Variánsokkal a termék készlete a variánsok összege
    const totalStock = cleanVariants.length > 0
      ? cleanVariants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
      : parseInt(form.stock);
    updateProduct(product.id, {
      ...form,
      price: parseFloat(form.price),
      stock: totalStock,
      rating: parseFloat(form.rating),
      sizes: sizesArr,
      variants: cleanVariants,
      // A korábbi rendelés-csökkentések felülírása: az admin által beírt érték a friss
      variantStock: null,
      variantSizeStock: null
    });
    onSave();
  };

  const subcats = productSubcategories.filter(s => s.categoryId === form.categoryId);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px',
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#0F2A1D' }}>✏️ Termék szerkesztése</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <FormField label="Név">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Ár (Ft)">
          <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Készlet (db)">
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Kategória">
          <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, subcategoryId: ''})} style={inputStyle}>
            {productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <FormField label="Alkategória">
          <select value={form.subcategoryId} onChange={e => setForm({...form, subcategoryId: e.target.value})} style={inputStyle}>
            <option value="">Válassz alkategóriát</option>
            {subcats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        <FormField label="Méretek (vesszővel)">
          <input type="text" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} placeholder="S, M, L, XL" style={inputStyle} />
        </FormField>

        <FormField label={`Színvariánsok${variants.length > 0 ? ` (össz. készlet: ${variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)} db)` : ''}`}>
          <VariantsEditor variants={variants} onChange={setVariants} sizes={sizesArr} />
        </FormField>

        <FormField label="Leírás">
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{...inputStyle, resize: 'vertical'}} />
        </FormField>

        <FormField label="Kép URL">
          <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Értékelés (0-5)">
          <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} style={inputStyle} />
        </FormField>

        <button onClick={handleSave} style={{
          width: '100%', padding: '0.75rem', backgroundColor: '#0F2A1D', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
          fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
        }}>
          <Save size={18} /> Mentés
        </button>
      </div>
    </div>
  );
};

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D', fontSize: '0.9rem' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit'
};

// ============================================================
// STOCK MANAGER (FIFO)
// ============================================================
const StockManager = ({ onChange }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockForm, setStockForm] = useState({ quantity: '', unitCost: '', batchNumber: '' });
  const [filterProduct, setFilterProduct] = useState('');

  const allProducts = getAllProducts();
  const history = getStockHistory();
  const filteredHistory = filterProduct ? history.filter(h => h.productId === parseInt(filterProduct)) : history;

  const handleAddStock = () => {
    if (!selectedProductId || !stockForm.quantity || parseInt(stockForm.quantity) <= 0) {
      alert('Válassz terméket és adj meg pozitív mennyiséget!');
      return;
    }
    addStockBatch(parseInt(selectedProductId), stockForm.quantity, stockForm.unitCost, stockForm.batchNumber);
    alert(`✅ ${stockForm.quantity} db hozzáadva!`);
    setStockForm({ quantity: '', unitCost: '', batchNumber: '' });
    setSelectedProductId('');
    onChange();
  };

  const selectedProduct = allProducts.find(p => p.id === parseInt(selectedProductId));
  const productBatches = selectedProductId ? getProductFIFOBatches(parseInt(selectedProductId)) : [];

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>📦 FIFO Készletkezelés</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Új tétel hozzáadása */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>➕ Új beszerzés (FIFO IN)</h3>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
            A bevétel automatikusan FIFO sorrendben kerül a készletbe.
          </p>

          <FormField label="Termék">
            <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} style={inputStyle}>
              <option value="">Válassz terméket</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (jelenleg: {p.stock || 0} db)</option>
              ))}
            </select>
          </FormField>

          <FormField label="Mennyiség (db)">
            <input type="number" min="1" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} style={inputStyle} />
          </FormField>

          <FormField label="Beszerzési egységár (Ft) - opcionális">
            <input type="number" min="0" step="0.01" value={stockForm.unitCost} onChange={e => setStockForm({...stockForm, unitCost: e.target.value})} style={inputStyle} placeholder="pl. 8500" />
          </FormField>

          <FormField label="Tétel azonosító (opcionális)">
            <input type="text" value={stockForm.batchNumber} onChange={e => setStockForm({...stockForm, batchNumber: e.target.value})} style={inputStyle} placeholder="pl. INV-2024-001" />
          </FormField>

          <button onClick={handleAddStock} style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#4CAF50', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <Plus size={16} /> Készlethez hozzáadás
          </button>
        </div>

        {/* Kiválasztott termék FIFO részletei */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>📊 FIFO sorrend</h3>
          {selectedProduct ? (
            <>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <strong>{selectedProduct.name}</strong><br/>
                Teljes készlet: <strong>{selectedProduct.stock || 0} db</strong>
              </p>
              {productBatches.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>Nincs követett FIFO tétel ehhez a termékhez.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Dátum</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Tétel</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Maradék</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Egységár</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productBatches.map((b, idx) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: idx === 0 ? '#fff9e6' : 'transparent' }}>
                        <td style={{ padding: '0.5rem 0' }}>
                          {idx === 0 && <span style={{ marginRight: '0.25rem' }}>👉</span>}
                          {new Date(b.date).toLocaleDateString('hu-HU')}
                        </td>
                        <td style={{ padding: '0.5rem 0' }}>{b.batchNumber}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 'bold' }}>{b.remaining} / {b.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{b.unitCost ? b.unitCost.toLocaleString('hu-HU') + ' Ft' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999' }}>
                👉 A legrégebbi tétel fogy először (FIFO)
              </p>
            </>
          ) : (
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Válassz terméket bal oldalon a FIFO részletekhez.</p>
          )}
        </div>
      </div>

      {/* History */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#0F2A1D' }}>📜 Készletmozgások (utolsó 50)</h3>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="">Minden termék</option>
            {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
            Nincs készletmozgás. Adj hozzá új tételt!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.9rem', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Dátum</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Termék</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Típus</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Mennyiség</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tétel/Ok</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 50).map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '0.5rem' }}>{new Date(h.date).toLocaleString('hu-HU')}</td>
                    <td style={{ padding: '0.5rem' }}>{h.productName}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: h.type === 'IN' ? '#4CAF50' : '#FF9800',
                        color: 'white'
                      }}>
                        {h.type === 'IN' ? '⬇ BE' : '⬆ KI'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: h.type === 'IN' ? '#4CAF50' : '#FF9800' }}>
                      {h.type === 'IN' ? '+' : '-'}{h.quantity}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                      {h.batchNumber || h.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// SALES MANAGER
// ============================================================
const SalesManager = ({ onChange }) => {
  const [selectedId, setSelectedId] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [label, setLabel] = useState('');
  const [endDate, setEndDate] = useState('');

  const allProducts = getAllProducts();
  const onSaleProducts = allProducts.filter(p => p.sale && p.sale.active);

  const selectedProduct = allProducts.find(p => p.id === parseInt(selectedId));

  const handleAddSale = () => {
    if (!selectedId || !discountValue) {
      alert('Válassz terméket és add meg a kedvezmény értékét!');
      return;
    }
    
    let salePrice;
    if (discountType === 'percent') {
      const pct = parseFloat(discountValue);
      if (pct <= 0 || pct >= 100) {
        alert('Százalék 1-99 között legyen!');
        return;
      }
      salePrice = Math.round(selectedProduct.price * (1 - pct / 100));
    } else {
      salePrice = parseFloat(discountValue);
      if (salePrice >= selectedProduct.price) {
        alert('Akciós ár kisebb legyen, mint az eredeti ár!');
        return;
      }
    }

    const finalLabel = label || (discountType === 'percent' ? `-${discountValue}%` : 'AKCIÓ');
    setProductSale(parseInt(selectedId), salePrice, finalLabel, endDate || null);
    
    setSelectedId('');
    setDiscountValue('');
    setLabel('');
    setEndDate('');
    onChange();
    alert('✅ Akció létrehozva!');
  };

  const handleRemoveSale = (id) => {
    if (window.confirm('Eltávolítod az akciót?')) {
      removeProductSale(id);
      onChange();
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>🏷️ Akciók kezelése</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Új akció */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>➕ Új akció létrehozása</h3>

          <FormField label="Termék">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={inputStyle}>
              <option value="">Válassz terméket</option>
              {allProducts.filter(p => !p.hidden).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price.toLocaleString('hu-HU')} Ft)
                </option>
              ))}
            </select>
          </FormField>

          {selectedProduct && (
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Eredeti ár: <strong>{selectedProduct.price.toLocaleString('hu-HU')} Ft</strong>
              </p>
            </div>
          )}

          <FormField label="Kedvezmény típusa">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setDiscountType('percent')} style={{
                flex: 1, padding: '0.5rem',
                backgroundColor: discountType === 'percent' ? '#0F2A1D' : 'white',
                color: discountType === 'percent' ? 'white' : '#0F2A1D',
                border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}>Százalék (%)</button>
              <button onClick={() => setDiscountType('fixed')} style={{
                flex: 1, padding: '0.5rem',
                backgroundColor: discountType === 'fixed' ? '#0F2A1D' : 'white',
                color: discountType === 'fixed' ? 'white' : '#0F2A1D',
                border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}>Fix ár (Ft)</button>
            </div>
          </FormField>

          <FormField label={discountType === 'percent' ? 'Kedvezmény %' : 'Új akciós ár (Ft)'}>
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} style={inputStyle}
              placeholder={discountType === 'percent' ? 'pl. 20' : 'pl. 14990'} />
          </FormField>

          {selectedProduct && discountValue && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', borderLeft: '4px solid #FF9800', borderRadius: '4px', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Új ár: <strong>{(discountType === 'percent' 
                  ? Math.round(selectedProduct.price * (1 - parseFloat(discountValue) / 100)) 
                  : parseFloat(discountValue)).toLocaleString('hu-HU')} Ft</strong>
              </p>
            </div>
          )}

          <FormField label="Egyedi címke (opcionális)">
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle}
              placeholder="pl. NYÁRI AKCIÓ, BLACK FRIDAY" />
          </FormField>

          <FormField label="Akció vége (opcionális)">
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </FormField>

          <button onClick={handleAddSale} style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#d32f2f', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <Tag size={16} /> Akció létrehozása
          </button>
        </div>

        {/* Aktív akciók */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>🔥 Aktív akciók ({onSaleProducts.length})</h3>
          {onSaleProducts.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>Jelenleg nincs aktív akció.</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {onSaleProducts.map(p => {
                const discount = Math.round(((p.price - p.sale.price) / p.price) * 100);
                const isExpiring = p.sale.endDate && new Date(p.sale.endDate) - new Date() < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div key={p.id} style={{
                    padding: '1rem', border: '1px solid #eee', borderRadius: '4px', marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                  }}>
                    <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
                        <span style={{ textDecoration: 'line-through', color: '#999' }}>{p.price.toLocaleString('hu-HU')} Ft</span>
                        {' → '}
                        <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{p.sale.price.toLocaleString('hu-HU')} Ft</span>
                        <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', backgroundColor: '#d32f2f', color: 'white', borderRadius: '3px', fontSize: '0.7rem' }}>-{discount}%</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                        Címke: <strong>{p.sale.label || 'AKCIÓ'}</strong>
                        {p.sale.endDate && (
                          <span style={{ marginLeft: '0.5rem', color: isExpiring ? '#FF9800' : '#666' }}>
                            • Lejár: {p.sale.endDate}{isExpiring && ' ⚠️'}
                          </span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => handleRemoveSale(p.id)} style={{
                      padding: '0.5rem', backgroundColor: '#d32f2f', color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ADD PRODUCT
// ============================================================
const AddProduct = ({ onChange, setTab }) => {
  const [form, setForm] = useState({
    name: '', price: '', description: '', stock: '', image: '', rating: 4.5,
    categoryId: 'munkaruha', subcategoryId: '', sizes: ''
  });
  const [variants, setVariants] = useState([]);

  const sizesArr = form.sizes.split(',').map(s => s.trim()).filter(Boolean);

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.categoryId || !form.subcategoryId) {
      alert('Név, ár, kategória és alkategória kötelező!');
      return;
    }
    const cleanVariants = variants.filter(v => v.code && v.color);
    if (variants.length > 0 && cleanVariants.length < variants.length) {
      alert('Minden színvariánsnál kötelező a KÓD és a színnév!');
      return;
    }
    const product = {
      ...form,
      price: parseFloat(form.price),
      stock: cleanVariants.length > 0
        ? cleanVariants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
        : (parseInt(form.stock) || 0),
      rating: parseFloat(form.rating) || 4.5,
      sizes: sizesArr,
      variants: cleanVariants,
      image: form.image || (cleanVariants[0] && cleanVariants[0].image) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
    };
    addCustomProduct(product);
    onChange();
    alert('✅ Termék hozzáadva!');
    setForm({ name: '', price: '', description: '', stock: '', image: '', rating: 4.5, categoryId: 'munkaruha', subcategoryId: '', sizes: '' });
    setVariants([]);
    setTab('products');
  };

  const subcats = productSubcategories.filter(s => s.categoryId === form.categoryId);

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>➕ Új termék kézi hozzáadása</h1>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
        <FormField label="Termék neve *">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Ár (Ft) *">
          <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Kategória *">
          <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, subcategoryId: ''})} style={inputStyle}>
            {productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <FormField label="Alkategória *">
          <select value={form.subcategoryId} onChange={e => setForm({...form, subcategoryId: e.target.value})} style={inputStyle}>
            <option value="">Válassz alkategóriát</option>
            {subcats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        <FormField label="Kezdő készlet (db)">
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={inputStyle} />
        </FormField>

        <FormField label="Méretek (vesszővel)">
          <input type="text" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} placeholder="S, M, L, XL" style={inputStyle} />
        </FormField>

        <FormField label="Színvariánsok (opcionális)">
          <VariantsEditor variants={variants} onChange={setVariants} sizes={sizesArr} />
        </FormField>

        <FormField label="Kép URL (opcionális)">
          <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." style={inputStyle} />
        </FormField>

        <FormField label="Leírás">
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} style={{...inputStyle, resize: 'vertical'}} />
        </FormField>

        <button onClick={handleSubmit} style={{
          width: '100%', padding: '0.75rem', backgroundColor: '#0F2A1D', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
          fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
        }}>
          <Plus size={18} /> Termék hozzáadása
        </button>
      </div>
    </div>
  );
};

// ============================================================
// IMPORT (CSV/XML)
// ============================================================
const ImportProducts = ({ onChange, setTab }) => {
  const [importType, setImportType] = useState('csv');
  const [fileContent, setFileContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target.result);
      handleParse(ev.target.result);
    };
    reader.readAsText(file);
  };

  const handleParse = (content) => {
    const result = importType === 'csv' ? parseCSV(content) : parseXML(content);
    if (result.error) {
      alert('❌ Hiba: ' + result.error);
      setPreview(null);
      setErrors([]);
      return;
    }
    setPreview(result.items);
    setErrors(result.errors || []);
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) {
      alert('Nincs importálható termék!');
      return;
    }
    addCustomProductsBatch(preview);
    alert(`✅ ${preview.length} termék hozzáadva!`);
    setFileContent('');
    setPreview(null);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange();
    setTab('products');
  };

  const csvTemplate = `name,price,categoryId,subcategoryId,description,image,stock,rating,sizes
"Példa Portwest póló",4990,munkaruha,polok,"Strapabíró pamut munkapóló",https://example.com/kep.jpg,50,4.7,"S;M;L;XL"
"Példa S3 cipő",19990,munkacipo,cipo-s3,"Vízálló biztonsági cipő",,30,4.8,"38;39;40;41;42;43;44"`;

  const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <product>
    <name>Példa Portwest póló</name>
    <price>4990</price>
    <categoryId>munkaruha</categoryId>
    <subcategoryId>polok</subcategoryId>
    <description>Strapabíró pamut munkapóló</description>
    <image>https://example.com/kep.jpg</image>
    <stock>50</stock>
    <rating>4.7</rating>
    <sizes>S;M;L;XL</sizes>
  </product>
  <product>
    <name>Példa S3 cipő</name>
    <price>19990</price>
    <categoryId>munkacipo</categoryId>
    <subcategoryId>cipo-s3</subcategoryId>
    <stock>30</stock>
    <sizes>38;39;40;41;42;43;44</sizes>
  </product>
</products>`;

  const downloadTemplate = () => {
    const content = importType === 'csv' ? csvTemplate : xmlTemplate;
    const mime = importType === 'csv' ? 'text/csv' : 'text/xml';
    const ext = importType === 'csv' ? 'csv' : 'xml';
    const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termek-sablon.${ext}`;
    a.click();
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>📂 CSV/XML Import</h1>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>Fájl típusa:</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setImportType('csv'); setPreview(null); setErrors([]); }} style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: importType === 'csv' ? '#0F2A1D' : 'white',
              color: importType === 'csv' ? 'white' : '#0F2A1D',
              border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}>📄 CSV</button>
            <button onClick={() => { setImportType('xml'); setPreview(null); setErrors([]); }} style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: importType === 'xml' ? '#0F2A1D' : 'white',
              color: importType === 'xml' ? 'white' : '#0F2A1D',
              border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}>📄 XML</button>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={downloadTemplate} style={{
            padding: '0.5rem 1rem', backgroundColor: '#C9A961', color: '#0F2A1D',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Download size={16} /> Sablon letöltése ({importType.toUpperCase()})
          </button>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            💡 Töltsd le a sablont, töltsd ki Excel-ben vagy szövegszerkesztőben, majd add fel ide!
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
            Fájl kiválasztása:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={importType === 'csv' ? '.csv,text/csv' : '.xml,text/xml'}
            onChange={handleFileChange}
            style={{ ...inputStyle, padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
            Vagy másold be tartalmat:
          </label>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            onBlur={() => fileContent && handleParse(fileContent)}
            rows={10}
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
            placeholder={importType === 'csv' ? 'name,price,categoryId,...' : '<?xml version="1.0"?>...'}
          />
          <button onClick={() => handleParse(fileContent)} disabled={!fileContent} style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: fileContent ? '#2196F3' : '#ccc',
            color: 'white', border: 'none', borderRadius: '4px',
            cursor: fileContent ? 'pointer' : 'not-allowed', fontWeight: 'bold'
          }}>
            🔍 Tartalom ellenőrzése
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0F2A1D' }}>
            ✅ Előnézet ({preview.length} termék)
          </h3>

          {errors.length > 0 && (
            <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #d32f2f', marginBottom: '1rem' }}>
              <strong>⚠️ Figyelmeztetések:</strong>
              <ul style={{ margin: '0.5rem 0 0 1rem' }}>
                {errors.map((err, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{err}</li>)}
              </ul>
            </div>
          )}

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Név</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Kategória</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ár</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Készlet</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '0.5rem' }}>{p.name}</td>
                    <td style={{ padding: '0.5rem', color: '#666' }}>{p.categoryId}/{p.subcategoryId}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.price?.toLocaleString('hu-HU')} Ft</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.stock || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' }}>
                ... és {preview.length - 10} további termék
              </p>
            )}
          </div>

          <button onClick={handleImport} style={{
            padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Upload size={16} /> Importálás megerősítése ({preview.length} termék)
          </button>
        </div>
      )}

      {/* Info / sablonok */}
      <div style={{ backgroundColor: '#fff9e6', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem', borderLeft: '4px solid #C9A961' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2A1D' }}>ℹ️ Tudnivalók</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#666', lineHeight: 1.7 }}>
          <li><strong>Kötelező mezők:</strong> name, price, categoryId, subcategoryId</li>
          <li><strong>Méretek (sizes):</strong> pontosvesszővel elválasztva (pl. <code>S;M;L;XL</code>)</li>
          <li><strong>Kategóriák:</strong> munkaruha, munkacipo, bakancs, kesztyu, kiegeszitok</li>
          <li><strong>Alkategóriák:</strong> a megfelelő kategória alkategóriáit használd (pl. polok, cipo-s3)</li>
          <li><strong>Kép URL:</strong> opcionális, üres esetén alap kép kerül beállításra</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================================
// ORDERS LIST
// ============================================================
const OrdersList = ({ onChange }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const trackingNumber = newStatus === 'shipped' ?
      prompt('Tracking szám (csomagszám):') : null;
    const note = prompt('Megjegyzés (opcionális, megjelenik a vevőnek):') || '';
    
    const updated = updateOrderStatus(orderId, newStatus, note, trackingNumber);
    setOrders(getOrders());
    if (onChange) onChange();
    
    // Email küldés: shipped, delivered, cancelled státuszoknál
    if (['shipped', 'delivered', 'cancelled'].includes(newStatus) && updated && updated.customer?.email) {
      try {
        const response = await fetch('/.netlify/functions/send-status-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: updated.id,
            customer: updated.customer,
            items: updated.cart || updated.items || [],
            total: updated.total,
            status: newStatus,
            trackingNumber: updated.trackingNumber,
            note
          })
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
          let msg = `✅ Email elküldve a vevőnek (${updated.customer.email})`;
          if (result.followupScheduled) {
            msg += '\n\n⭐ Az értékelő email 30 perc múlva automatikusan kimegy.';
          }
          alert(msg);
        } else {
          alert(`⚠️ Státusz frissítve, de email nem ment: ${result.error || 'Ismeretlen hiba'}\n\nEllenőrizd a Resend logokat.`);
        }
      } catch (e) {
        console.error('Email send error:', e);
        alert(`⚠️ Státusz frissítve, de email küldési hiba: ${e.message}`);
      }
    }
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>🚚 Rendelések & Workflow</h1>

      {/* Status filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('all')} style={{
          padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none',
          backgroundColor: statusFilter === 'all' ? '#0F2A1D' : 'white',
          color: statusFilter === 'all' ? 'white' : '#0F2A1D',
          cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>Mind ({orders.length})</button>
        {ORDER_STATUSES.map(s => {
          const count = orders.filter(o => o.status === s.id).length;
          return (
            <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{
              padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none',
              backgroundColor: statusFilter === s.id ? s.color : 'white',
              color: statusFilter === s.id ? 'white' : '#0F2A1D',
              cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>{s.icon} {s.name} ({count})</button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
          <ShoppingBag size={64} style={{ color: '#ddd', marginBottom: '1rem' }} />
          <p>Nincs ilyen státuszú rendelés.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rendelés / Számla</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Dátum</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vásárló</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Összeg</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Státusz</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const statusInfo = ORDER_STATUSES.find(s => s.id === o.status) || ORDER_STATUSES[0];
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.id}</div>
                      {o.invoiceNumber && <div style={{ color: '#999', fontSize: '0.75rem' }}>{o.invoiceNumber}</div>}
                      {o.trackingNumber && <div style={{ color: '#0F2A1D', fontSize: '0.75rem' }}>📦 {o.trackingNumber}</div>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{new Date(o.date).toLocaleDateString('hu-HU')}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {o.customer?.firstName || o.customerName || ''} {o.customer?.lastName || o.name || ''}
                      <div style={{ color: '#999', fontSize: '0.75rem' }}>{o.customer?.email || ''}</div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#C9A961' }}>
                      {(o.total || 0).toLocaleString('hu-HU')} Ft
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <select value={o.status || 'pending'}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{
                          padding: '0.3rem 0.5rem', border: 'none', borderRadius: '4px',
                          backgroundColor: statusInfo.color, color: 'white',
                          fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                        }}>
                        {ORDER_STATUSES.map(s => (
                          <option key={s.id} value={s.id} style={{ backgroundColor: 'white', color: '#333' }}>
                            {s.icon} {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => setSelectedOrder(o)} title="Részletek"
                        style={{ padding: '0.4rem', border: 'none', backgroundColor: '#f5f5f5', borderRadius: '4px', cursor: 'pointer', marginRight: '0.25rem' }}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openInvoice(o)} title="Számla nyomtatás"
                        style={{ padding: '0.4rem', border: 'none', backgroundColor: '#C9A961', color: '#0F2A1D', borderRadius: '4px', cursor: 'pointer' }}>
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rendelés részletek modal */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#0F2A1D' }}>Rendelés részletek: {selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Vásárló:</strong> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Email:</strong> {selectedOrder.customer?.email}</p>
              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Telefon:</strong> {selectedOrder.customer?.phone}</p>
              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Cím:</strong> {selectedOrder.customer?.address}, {selectedOrder.customer?.zip} {selectedOrder.customer?.city}</p>
              {selectedOrder.trackingNumber && <p style={{ margin: '0 0 0.25rem 0' }}><strong>📦 Tracking:</strong> {selectedOrder.trackingNumber}</p>}
            </div>

            <h3 style={{ color: '#0F2A1D' }}>Tételek</h3>
            <table style={{ width: '100%', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Termék</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Méret</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Db</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Egységár</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Részösszeg</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.cart || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '0.5rem' }}>{item.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.size || '-'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price.toLocaleString('hu-HU')} Ft</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString('hu-HU')} Ft</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ color: '#0F2A1D' }}>Státusz történet</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {(selectedOrder.statusHistory || []).map((h, i) => {
                const sInfo = ORDER_STATUSES.find(s => s.id === h.status) || ORDER_STATUSES[0];
                return (
                  <div key={i} style={{ padding: '0.5rem', borderLeft: `3px solid ${sInfo.color}`, marginBottom: '0.5rem', backgroundColor: '#f9f9f9' }}>
                    <strong>{sInfo.icon} {sInfo.name}</strong> - {new Date(h.date).toLocaleString('hu-HU')}
                    {h.note && <div style={{ color: '#666', fontSize: '0.85rem' }}>{h.note}</div>}
                  </div>
                );
              })}
            </div>

            <button onClick={() => openInvoice(selectedOrder)} style={{
              padding: '0.75rem 1.5rem', backgroundColor: '#C9A961', color: '#0F2A1D',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Printer size={18} /> Számla nyomtatás / PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// REPORTS TAB - Heti/havi grafikon, top termékek
// ============================================================
const ReportsTab = () => {
  const [period, setPeriod] = useState('week');
  const [report, setReport] = useState(null);

  useEffect(() => {
    setReport(getSalesReport(period));
  }, [period]);

  if (!report) return null;

  const days = Object.keys(report.byDay).sort();
  const maxRevenue = Math.max(...Object.values(report.byDay).map(d => d.revenue), 1);

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>📊 Részletes Riportok</h1>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        {[
          { id: 'week', name: 'Utolsó 7 nap' },
          { id: 'month', name: 'Utolsó 30 nap' },
          { id: 'quarter', name: 'Utolsó 90 nap' },
          { id: 'year', name: 'Utolsó 365 nap' }
        ].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding: '0.5rem 1rem', borderRadius: '4px', border: 'none',
            backgroundColor: period === p.id ? '#0F2A1D' : 'white',
            color: period === p.id ? 'white' : '#0F2A1D',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>{p.name}</button>
        ))}
      </div>

      {/* KPI kártyák */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="Rendelések száma" value={report.periodOrders} color="#2196F3" icon="📦" />
        <StatCard title="Bevétel" value={`${report.periodRevenue.toLocaleString('hu-HU')} Ft`} color="#4CAF50" icon="💰" />
        <StatCard title="Átlag rendelés" value={`${report.avgOrderValue.toLocaleString('hu-HU')} Ft`} color="#C9A961" icon="📊" />
        <StatCard title="Visszatérő vásárlók" value={`${report.returningPct}%`} color="#9C27B0" icon="🔁" />
      </div>

      {/* Napi bevétel grafikon */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>📈 Napi bevétel</h3>
        {days.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Nincs adat ebben az időszakban.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
            {days.map(day => {
              const data = report.byDay[day];
              const height = (data.revenue / maxRevenue) * 100;
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem' }}>
                    {(data.revenue / 1000).toFixed(0)}k
                  </div>
                  <div style={{
                    width: '100%', backgroundColor: '#C9A961',
                    height: `${height}%`, minHeight: '4px', borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s'
                  }} title={`${data.count} rendelés, ${data.revenue.toLocaleString('hu-HU')} Ft`}></div>
                  <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem', writingMode: 'vertical-rl' }}>
                    {new Date(day).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top termékek + Kategória teljesítmény */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>🏆 Top 10 termék (eladott db)</h3>
          {report.topProducts.length === 0 ? (
            <p style={{ color: '#999' }}>Nincs adat.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #C9A961' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Termék</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Db</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Bevétel</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '0.5rem', color: '#999' }}>{i + 1}.</td>
                    <td style={{ padding: '0.5rem' }}>{p.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{p.quantity}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', color: '#C9A961', fontWeight: 'bold' }}>{p.revenue.toLocaleString('hu-HU')} Ft</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>📂 Kategória teljesítmény</h3>
          {Object.keys(report.categoryPerf).length === 0 ? (
            <p style={{ color: '#999' }}>Nincs adat.</p>
          ) : (
            <div>
              {Object.entries(report.categoryPerf).sort((a, b) => b[1].revenue - a[1].revenue).map(([catId, data]) => {
                const cat = productCategories.find(c => c.id === catId);
                const maxCatRev = Math.max(...Object.values(report.categoryPerf).map(d => d.revenue), 1);
                const pct = (data.revenue / maxCatRev) * 100;
                return (
                  <div key={catId} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      <span>{cat?.icon} {cat?.name || catId}</span>
                      <span style={{ fontWeight: 'bold', color: '#C9A961' }}>{data.revenue.toLocaleString('hu-HU')} Ft ({data.quantity} db)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#C9A961', transition: 'all 0.3s' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Egy mini stat kártya
const StatCard = ({ title, value, color, icon }) => (
  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <div style={{ color: '#999', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{icon} {title}</div>
    <div style={{ color: '#0F2A1D', fontSize: '1.4rem', fontWeight: 'bold' }}>{value}</div>
  </div>
);

// ============================================================
// SUPPLIER TAB - Beszállító értesítések
// ============================================================
const CouponsManager = ({ onChange }) => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', minOrder: '', expiry: '' });

  useEffect(() => {
    setCoupons(getCoupons());
  }, []);

  const refresh = () => {
    setCoupons(getCoupons());
    if (onChange) onChange();
  };

  const handleCreate = () => {
    if (!form.code.trim()) { alert('Adj meg kuponkódot!'); return; }
    if (!form.value || parseFloat(form.value) <= 0) { alert('Adj meg érvényes kedvezményt!'); return; }
    if (form.type === 'percent' && parseFloat(form.value) > 100) { alert('A százalékos kedvezmény max. 100% lehet!'); return; }
    const result = saveCoupon(form);
    if (result.error) { alert(result.error); return; }
    setForm({ code: '', type: 'percent', value: '', minOrder: '', expiry: '' });
    refresh();
    alert(`✅ ${result.code} kupon elmentve!`);
  };

  const handleToggle = (c) => {
    saveCoupon({ ...c, active: !c.active });
    refresh();
  };

  const handleDelete = (code) => {
    if (window.confirm(`Biztosan törlöd a(z) ${code} kupont?`)) {
      deleteCoupon(code);
      refresh();
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const inputStyle = { padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>🎟️ Kuponkódok</h1>

      {/* Új kupon */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, color: '#0F2A1D' }}>➕ Új kupon létrehozása</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Kuponkód</label>
            <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }} value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="pl. NYAR10" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Típus</label>
            <select style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Százalék (%)</option>
              <option value="fixed">Fix összeg (Ft)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
              Kedvezmény {form.type === 'percent' ? '(%)' : '(Ft)'}
            </label>
            <input type="number" min="1" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percent' ? '10' : '2000'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Min. rendelés (Ft)</label>
            <input type="number" min="0" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={form.minOrder}
              onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Lejárat (opcionális)</label>
            <input type="date" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={form.expiry}
              onChange={e => setForm({ ...form, expiry: e.target.value })} />
          </div>
          <button onClick={handleCreate} style={{
            padding: '0.65rem 1rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            <Save size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Mentés
          </button>
        </div>
      </div>

      {/* Kupon lista */}
      {coupons.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
          <Tag size={64} style={{ color: '#ddd', marginBottom: '1rem' }} />
          <p>Még nincs kupon. Hozd létre az elsőt fent! 🎟️</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0F2A1D', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Kód</th>
                <th style={{ padding: '0.75rem 1rem' }}>Kedvezmény</th>
                <th style={{ padding: '0.75rem 1rem' }}>Min. rendelés</th>
                <th style={{ padding: '0.75rem 1rem' }}>Lejárat</th>
                <th style={{ padding: '0.75rem 1rem' }}>Beváltva</th>
                <th style={{ padding: '0.75rem 1rem' }}>Státusz</th>
                <th style={{ padding: '0.75rem 1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const expired = c.expiry && c.expiry < today;
                return (
                  <tr key={c.code} style={{ borderBottom: '1px solid #eee', opacity: (!c.active || expired) ? 0.55 : 1 }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0F2A1D' }}>{c.code}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#C9A961', fontWeight: 'bold' }}>
                      {c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString('hu-HU')} Ft`}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{c.minOrder ? `${c.minOrder.toLocaleString('hu-HU')} Ft` : '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: expired ? '#d32f2f' : 'inherit' }}>
                      {c.expiry || '—'}{expired ? ' (lejárt)' : ''}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{c.usedCount || 0}×</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button onClick={() => handleToggle(c)} style={{
                        padding: '0.3rem 0.7rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        backgroundColor: c.active ? '#4CAF50' : '#999', color: 'white', fontSize: '0.8rem', fontWeight: 'bold'
                      }}>
                        {c.active ? 'Aktív' : 'Inaktív'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(c.code)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SupplierTab = ({ onChange }) => {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    setNotifs(getSupplierNotifications());
  }, []);

  const handleResolve = (productId) => {
    if (window.confirm('Megrendelted már a beszállítótól?')) {
      removeSupplierNotification(productId);
      setNotifs(getSupplierNotifications());
      if (onChange) onChange();
    }
  };

  const handleEmailDraft = (notif) => {
    const subject = `Termék utánrendelés: ${notif.productName}`;
    const body = `Tisztelt Beszállító!

Az alábbi termékből szeretnénk utánrendelni:

Termék: ${notif.productName}
Jelenlegi készlet: ${notif.currentStock} db
Javasolt rendelési mennyiség: ${notif.suggestedOrder} db

Kérjük, küldjenek visszaigazolást az árról és a szállítási határidőről.

Üdvözlettel,
Trident Shield Group Kft.
iroda@tuz-munkavedelmiszaki.hu
+36 30 272 2571`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDepiendSync = async () => {
    if (!window.confirm('Lekérjük a Depiend aktuális árait és frissítjük a webshop-árakat (árrés-szabállyal). Indulhat?')) return;
    try {
      const res = await fetch('/.netlify/functions/depiend-sync', {
        method: 'POST',
        headers: { 'x-admin-password': sessionStorage.getItem('ms_admin_pw') || '' }
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || 'Szinkron hiba');
      const lines = (r.changed || []).map(c => `${c.articleNo}: ${c.oldPrice.toLocaleString('hu-HU')} → ${c.newPrice.toLocaleString('hu-HU')} Ft`);
      alert(`✅ Depiend szinkron kész!\n${r.checked} termék ellenőrizve, ${(r.changed || []).length} árváltozás.\n${lines.slice(0, 10).join('\n')}${(r.errors || []).length ? `\n⚠️ ${r.errors.length} hiba` : ''}`);
      if (onChange) onChange();
    } catch (e) {
      alert(`❌ Szinkron hiba: ${e.message}\n(Lokális fejlesztésnél a function csak "netlify dev" alatt fut.)`);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>🔔 Beszállító Értesítések</h1>
      <div style={{ backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderLeft: '4px solid #C9A961' }}>
        <div style={{ flex: '1 1 300px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#0F2A1D' }}>🔄 Depiend ár-szinkron</p>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.85rem' }}>
            Naponta automatikusan fut (hajnali 4-kor). Kézzel is indítható — a beszállítói árakból árrés-szabállyal számolja a webshop-árakat.
          </p>
        </div>
        <button onClick={handleDepiendSync} style={{
          padding: '0.6rem 1.2rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
          borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          <RefreshCw size={16} /> Szinkron most
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Az alábbi termékek készlete kritikusan alacsony — érdemes utánrendelni a beszállítótól.
      </p>

      {notifs.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
          <Bell size={64} style={{ color: '#ddd', marginBottom: '1rem' }} />
          <p>Nincs aktív beszállító értesítés. Minden készlet rendben! 👍</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notifs.map(n => (
            <div key={n.id} style={{
              backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px',
              borderLeft: '4px solid #FF9800', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F2A1D' }}>{n.productName}</h3>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                  Jelenlegi készlet: <strong style={{ color: '#FF9800' }}>{n.currentStock} db</strong>
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                  Javasolt rendelés: <strong style={{ color: '#4CAF50' }}>{n.suggestedOrder} db</strong>
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#999' }}>
                  Bejegyezve: {new Date(n.date).toLocaleString('hu-HU')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEmailDraft(n)} style={{
                  padding: '0.6rem 1rem', backgroundColor: '#2196F3', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Mail size={14} /> Email vázlat
                </button>
                <button onClick={() => handleResolve(n.productId)} style={{
                  padding: '0.6rem 1rem', backgroundColor: '#4CAF50', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                }}>
                  ✓ Megrendeltem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// BLOG MANAGER
// ============================================================
const BlogManager = ({ onChange }) => {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setPosts(getBlogPosts());
  }, []);

  const handleSave = (post) => {
    saveBlogPost(post);
    setPosts(getBlogPosts());
    setEditing(null);
    if (onChange) onChange();
    alert('✅ Mentve!');
  };

  const handleDelete = (id) => {
    if (window.confirm('Biztosan törlöd ezt a cikket?')) {
      deleteBlogPost(id);
      setPosts(getBlogPosts());
    }
  };

  if (editing) {
    return <BlogEditor post={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#0F2A1D' }}>📝 Blog Manager</h1>
        <button onClick={() => setEditing({})} style={{
          padding: '0.6rem 1.25rem', backgroundColor: '#C9A961', color: '#0F2A1D',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <Plus size={18} /> Új cikk
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {posts.map(p => (
          <div key={p.id} style={{
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex', gap: '1rem', alignItems: 'flex-start'
          }}>
            {p.image && <img src={p.image} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F2A1D' }}>{p.title}</h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>{p.excerpt}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>
                {new Date(p.date).toLocaleDateString('hu-HU')} • {p.author} • slug: /{p.slug}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button onClick={() => setEditing(p)} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Edit2 size={12} /> Szerkesztés
              </button>
              <button onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Trash2 size={12} /> Törlés
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BlogEditor = ({ post, onSave, onCancel }) => {
  const [data, setData] = useState({
    title: post.title || '',
    excerpt: post.excerpt || '',
    content: post.content || '<p>Cikk tartalma...</p>',
    image: post.image || '',
    tags: (post.tags || []).join(', '),
    author: post.author || 'MunkavédelmiShop',
    date: post.date || new Date().toISOString().split('T')[0],
    id: post.id
  });

  const handleSubmit = () => {
    if (!data.title || !data.excerpt) {
      alert('Cím és Rövid leírás kötelező!');
      return;
    }
    onSave({
      ...data,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#0F2A1D' }}>{post.id ? 'Cikk szerkesztése' : 'Új cikk'}</h1>
        <button onClick={onCancel} style={{ padding: '0.5rem 1rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ← Vissza
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Cím: *</label>
        <input type="text" value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
          style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Rövid leírás (excerpt): *</label>
        <textarea value={data.excerpt} onChange={e => setData({ ...data, excerpt: e.target.value })}
          rows={2} style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Borítókép URL:</label>
        <input type="text" value={data.image} onChange={e => setData({ ...data, image: e.target.value })}
          placeholder="https://..." style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Tartalom (HTML):</label>
        <textarea value={data.content} onChange={e => setData({ ...data, content: e.target.value })}
          rows={12} style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Szerző:</label>
            <input type="text" value={data.author} onChange={e => setData({ ...data, author: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Dátum:</label>
            <input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', color: '#0F2A1D' }}>Tagek (vesszővel):</label>
            <input type="text" value={data.tags} onChange={e => setData({ ...data, tags: e.target.value })}
              placeholder="tag1, tag2" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <button onClick={handleSubmit} style={{
          padding: '0.75rem 1.5rem', backgroundColor: '#C9A961', color: '#0F2A1D',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <Save size={18} /> Mentés
        </button>
      </div>
    </div>
  );
};

// ============================================================
// SEO TOOLS - Google Shopping feed letöltés, sitemap regenerálás
// ============================================================
const SeoTools = () => {
  const handleDownloadFeed = () => {
    const xml = generateGoogleShoppingFeed(window.location.origin);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-shopping-feed.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // eslint-disable-next-line
  const handleCopyFeedUrl = () => {
    const feedUrl = `${window.location.origin}/google-shopping-feed.xml`;
    navigator.clipboard.writeText(feedUrl);
    alert('Feed URL másolva: ' + feedUrl);
  };

  const products = getAllProducts().filter(p => !p.hidden);
  const posts = getBlogPosts();

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0', color: '#0F2A1D' }}>🔍 SEO Eszközök</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Google Shopping Feed */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>🛒 Google Shopping Feed</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Generálj egy XML feed-et amit a Google Merchant Centerbe lehet feltölteni. {products.filter(p => p.stock > 0).length} elérhető termék.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleDownloadFeed} style={{
              flex: 1, padding: '0.75rem', backgroundColor: '#0F2A1D', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <Download size={16} /> XML letöltés
            </button>
          </div>
        </div>

        {/* Statisztika */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>📊 SEO statisztika</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
            <li style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee' }}>
              Indexelhető termékek: <strong>{products.length}</strong>
            </li>
            <li style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee' }}>
              Blog cikkek: <strong>{posts.length}</strong>
            </li>
            <li style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee' }}>
              Egyedi márkák: <strong>{new Set(products.map(p => p.brand)).size}</strong>
            </li>
            <li style={{ padding: '0.4rem 0' }}>
              Schema.org Product markup: <strong style={{ color: '#4CAF50' }}>✓ Aktív</strong>
            </li>
          </ul>
        </div>

        {/* URL struktúra */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#0F2A1D', marginTop: 0 }}>🔗 SEO-barát URL-ek</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#666', margin: '0.5rem 0' }}>Termékek (példa első 10):</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {products.slice(0, 10).map(p => (
                <li key={p.id} style={{ padding: '0.2rem 0', borderBottom: '1px solid #f5f5f5' }}>
                  /termek/<strong>{p.slug}</strong>
                </li>
              ))}
            </ul>
            <h4 style={{ color: '#666', margin: '1rem 0 0.5rem 0' }}>Blog cikkek:</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {posts.map(p => (
                <li key={p.id} style={{ padding: '0.2rem 0', borderBottom: '1px solid #f5f5f5' }}>
                  /blog/<strong>{p.slug}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
