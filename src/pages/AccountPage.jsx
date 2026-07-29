import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Package, User, Mail, Lock } from 'lucide-react';
import { isAuthEnabled, getUser, onAuthChange, signIn, signUp, signOut, resetPassword, getMyOrders } from '../data/auth';

const STATUS_LABEL = {
  pending: { t: 'Feldolgozás alatt', c: '#FF9800' },
  paid: { t: 'Fizetve', c: '#2196F3' },
  packed: { t: 'Csomagolva', c: '#9C27B0' },
  shipped: { t: 'Úton', c: '#00897B' },
  delivered: { t: 'Kézbesítve', c: '#4CAF50' },
  cancelled: { t: 'Lemondva', c: '#d32f2f' }
};

const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [mode, setMode] = useState('login'); // login | register | reset
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Fiókom | MunkavédelmiShop'; }, []);

  useEffect(() => {
    getUser().then(u => { setUser(u); setReady(true); }).catch(() => setReady(true));
    return onAuthChange(u => setUser(u));
  }, []);

  const loadOrders = useCallback(() => {
    setOrdersError('');
    getMyOrders().then(setOrders).catch(e => setOrdersError(e.message || 'Betöltési hiba'));
  }, []);

  useEffect(() => { if (user) loadOrders(); }, [user, loadOrders]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else if (mode === 'register') {
        await signUp(form.email, form.password, form.name);
        setMsg('Sikeres regisztráció! Ha megerősítő levelet kaptál, kattints a benne lévő linkre.');
      } else {
        await resetPassword(form.email);
        setMsg('Elküldtük a jelszó-visszaállító levelet. Nézd meg a postafiókod!');
      }
    } catch (err) {
      setError(err.message || 'Hiba történt.');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <header style={{ backgroundColor: 'white', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.4rem' }}>
          🛡️ MunkavédelmiShop
        </Link>
        <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={18} /> Vissza a webshopra
        </Link>
      </div>
    </header>
  );

  if (!isAuthEnabled) {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        {header}
        <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#666' }}>A vásárlói fiókok jelenleg nem érhetők el.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        {header}
        <p style={{ textAlign: 'center', color: '#999', marginTop: '3rem' }}>Betöltés…</p>
      </div>
    );
  }

  // ===================== BEJELENTKEZVE =====================
  if (user) {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        {header}
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif', margin: 0 }}>👤 Fiókom</h1>
              <p style={{ color: '#666', margin: '0.25rem 0 0 0' }}>
                {(user.user_metadata && user.user_metadata.full_name) ? `${user.user_metadata.full_name} · ` : ''}{user.email}
              </p>
            </div>
            <button onClick={() => signOut()} style={{
              backgroundColor: 'white', color: '#0F2A1D', border: '1px solid #ddd',
              padding: '0.6rem 1.1rem', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <LogOut size={16} /> Kijelentkezés
            </button>
          </div>

          <h2 style={{ color: '#0F2A1D', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} /> Rendeléseim
          </h2>

          {ordersError && <p style={{ color: '#d32f2f' }}>{ordersError}</p>}

          {orders.length === 0 && !ordersError && (
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#888' }}>
              Még nincs rendelésed ezzel az e-mail-címmel.
              <div style={{ marginTop: '1rem' }}>
                <Link to="/" style={{ backgroundColor: '#0F2A1D', color: 'white', padding: '0.65rem 1.25rem', borderRadius: '4px', textDecoration: 'none' }}>
                  Irány a webshop
                </Link>
              </div>
            </div>
          )}

          {orders.map(o => {
            const st = STATUS_LABEL[o.status] || STATUS_LABEL.pending;
            return (
              <div key={o.id} style={{ backgroundColor: 'white', padding: '1.1rem 1.25rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#0F2A1D' }}>{o.id}</strong>
                    <span style={{ color: '#999', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('hu-HU') : ''}
                    </span>
                  </div>
                  <span style={{ backgroundColor: st.c, color: 'white', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {st.t}
                  </span>
                </div>

                <div style={{ color: '#555', fontSize: '0.9rem', margin: '0.6rem 0' }}>
                  {(o.items || []).map((i, k) => (
                    <div key={k}>
                      {i.quantity} × {i.name}
                      {(i.size || i.color) && <span style={{ color: '#999' }}> ({[i.size, i.color].filter(Boolean).join(' · ')})</span>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '0.6rem' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>
                    {o.invoiceNumber && <>Számla: {o.invoiceNumber}</>}
                    {o.trackingNumber && <> · Csomagszám: {o.trackingNumber}</>}
                  </div>
                  <strong style={{ color: '#C9A961', fontSize: '1.05rem' }}>{(o.total || 0).toLocaleString('hu-HU')} Ft</strong>
                </div>
              </div>
            );
          })}

          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '1.5rem' }}>
            A számlát minden rendelésről e-mailben küldjük. Ha nem találod, írj az iroda@tuz-munkavedelmiszaki.hu címre.
          </p>
        </div>
      </div>
    );
  }

  // ===================== BEJELENTKEZÉS / REGISZTRÁCIÓ =====================
  const inputStyle = { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontWeight: 'bold', color: '#0F2A1D', marginBottom: '0.3rem', fontSize: '0.9rem' };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {header}
      <div style={{ maxWidth: '440px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif', marginTop: 0, fontSize: '1.5rem' }}>
            {mode === 'login' ? '👤 Bejelentkezés' : mode === 'register' ? '✨ Regisztráció' : '🔑 Elfelejtett jelszó'}
          </h1>
          <p style={{ color: '#666', fontSize: '0.92rem', marginTop: 0 }}>
            {mode === 'login' && 'Jelentkezz be a korábbi rendeléseid megtekintéséhez.'}
            {mode === 'register' && 'Hozz létre fiókot, hogy nyomon követhesd a rendeléseidet és számláidat.'}
            {mode === 'reset' && 'Add meg az e-mail-címed, és küldünk egy jelszó-visszaállító linket.'}
          </p>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}><User size={13} style={{ verticalAlign: 'middle' }} /> Név</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Teljes neved" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={labelStyle}><Mail size={13} style={{ verticalAlign: 'middle' }} /> E-mail-cím *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com" style={inputStyle} />
            </div>
            {mode !== 'reset' && (
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}><Lock size={13} style={{ verticalAlign: 'middle' }} /> Jelszó *</label>
                <input type="password" required minLength={6} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Legalább 6 karakter" style={inputStyle} />
              </div>
            )}

            {error && <div style={{ backgroundColor: '#fdecea', color: '#b3261e', padding: '0.7rem', borderRadius: '4px', fontSize: '0.88rem', marginBottom: '0.9rem' }}>{error}</div>}
            {msg && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '0.7rem', borderRadius: '4px', fontSize: '0.88rem', marginBottom: '0.9rem' }}>{msg}</div>}

            <button type="submit" disabled={busy} style={{
              width: '100%', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
              padding: '0.8rem', borderRadius: '4px', cursor: busy ? 'default' : 'pointer',
              fontWeight: 'bold', fontSize: '0.95rem', opacity: busy ? 0.6 : 1
            }}>
              {busy ? 'Folyamatban…' : mode === 'login' ? 'Bejelentkezés' : mode === 'register' ? 'Fiók létrehozása' : 'Visszaállító link kérése'}
            </button>
          </form>

          <div style={{ marginTop: '1.1rem', fontSize: '0.88rem', color: '#666', textAlign: 'center', lineHeight: 2 }}>
            {mode === 'login' && (<>
              <button onClick={() => { setMode('register'); setError(''); setMsg(''); }} style={linkBtn}>Még nincs fiókom</button>
              {' · '}
              <button onClick={() => { setMode('reset'); setError(''); setMsg(''); }} style={linkBtn}>Elfelejtettem a jelszavam</button>
            </>)}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setError(''); setMsg(''); }} style={linkBtn}>← Vissza a bejelentkezéshez</button>
            )}
          </div>
        </div>

        <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.25rem' }}>
          Fiók nélkül is tudsz vásárolni. A rendelésed állapotát a{' '}
          <Link to="/rendeles-kovetes" style={{ color: '#0F2A1D' }}>rendeléskövetőben</Link> is megnézheted.
        </p>
      </div>
    </div>
  );
};

const linkBtn = {
  background: 'none', border: 'none', color: '#0F2A1D', cursor: 'pointer',
  textDecoration: 'underline', fontSize: '0.88rem', padding: 0
};

export default AccountPage;
