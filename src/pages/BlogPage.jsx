import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { getBlogPosts } from '../data/storage';
import { setMetaTag, setCanonical } from '../utils/seo';

// Olvasási idő: 1-3 perc között, cikkenként állandó (nem valódi becslés a
// szöveghosszból — a cikk azonosítója alapján determinisztikusan "sorsolt",
// hogy ne változzon újratöltésre)
export const readingTime = (post) => {
  const key = (post && (post.slug || post.id)) ? String(post.slug || post.id) : '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return 1 + (hash % 3);
};

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    document.title = 'Szakértői blog - TridentShop';
    setPosts(getBlogPosts());
    setMetaTag('description', 'Munkavédelmi szakértői blog: szabványok, útmutatók, vásárlási tanácsok. Hogyan válassz munkacipőt, kesztyűt, láthatósági ruhát.');
    setCanonical('/blog');
  }, []);

  // Szűrő-címkék a cikkek tagjeiből (előfordulás szerint, max 8)
  const tagCounts = {};
  posts.forEach(p => (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const filterTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const visible = activeTag ? sorted.filter(p => (p.tags || []).includes(activeTag)) : sorted;
  const [featured, ...rest] = visible;

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{
        backgroundColor: 'white', padding: '1rem 1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderBottom: '1px solid #eee'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 700 }}>
            TridentShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      {/* Bátor, sík színű fejléc-sáv — a webshop többi részével egyező, diagonál
          arany csíkkal (mission-band minta), gradiens helyett */}
      <div style={{ position: 'relative', backgroundColor: '#0F2A1D', color: 'white', padding: '3.5rem 1.5rem', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '10px',
          backgroundColor: '#C9A961', clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)'
        }} />
        <span style={{
          display: 'inline-block', color: '#C9A961', fontSize: '0.8rem', fontWeight: 700,
          letterSpacing: '0.25em', marginBottom: '1rem', textTransform: 'uppercase'
        }}>
          Szakértői tartalom
        </span>
        <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', margin: 0, fontFamily: 'Georgia, serif', fontWeight: 700, textTransform: 'uppercase' }}>
          Szakértői blog
        </h1>
        <p style={{ fontSize: '1.05rem', opacity: 0.9, marginTop: '0.75rem', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
          Útmutatók, szabvány-magyarázatok és vásárlási tanácsok — hogy pontosan azt vedd meg, amire tényleg szükséged van.
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        {/* Téma-szűrők — éles sarkú, nagybetűs pillek a lekerekített helyett */}
        {filterTags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button onClick={() => setActiveTag(null)} style={{
              padding: '0.4rem 1rem', borderRadius: 0, cursor: 'pointer', fontSize: '0.78rem',
              border: '1px solid #0F2A1D', textTransform: 'uppercase', letterSpacing: '0.03em',
              backgroundColor: activeTag === null ? '#0F2A1D' : 'white',
              color: activeTag === null ? 'white' : '#0F2A1D', fontWeight: 700
            }}>
              Összes ({posts.length})
            </button>
            {filterTags.map(t => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} style={{
                padding: '0.4rem 1rem', borderRadius: 0, cursor: 'pointer', fontSize: '0.78rem',
                border: '1px solid #ccc', textTransform: 'uppercase', letterSpacing: '0.03em',
                backgroundColor: activeTag === t ? '#0F2A1D' : 'white',
                color: activeTag === t ? 'white' : '#555', fontWeight: 700
              }}>
                {t} ({tagCounts[t]})
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', padding: '3rem' }}>Nincs a szűrésnek megfelelő cikk.</p>
        )}

        {/* Kiemelt cikk — a lista legfrissebb bejegyzése, nagy, kétoszlopos elrendezésben */}
        {featured && (
          <Link to={`/blog/${featured.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <article style={{
              backgroundColor: 'white', border: '1px solid #eee', marginBottom: '2.5rem',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A961'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; }}
            >
              <div style={{ backgroundColor: '#f5f5f5', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
                {featured.image && (
                  <img src={featured.image} alt={featured.title} loading="lazy"
                    style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-block', backgroundColor: '#0F2A1D', color: '#C9A961',
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem', width: 'fit-content'
                }}>
                  Legfrissebb
                </span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#999', marginBottom: '0.6rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {readingTime(featured)} perc olvasás
                  </span>
                </div>
                <h2 style={{ color: '#0F2A1D', fontSize: '1.6rem', margin: '0 0 0.75rem 0', fontFamily: 'Georgia, serif', lineHeight: 1.25 }}>
                  {featured.title}
                </h2>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                  {featured.excerpt}
                </p>
                <span style={{ color: '#0F2A1D', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Tovább olvasom →
                </span>
              </div>
            </article>
          </Link>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem'
        }}>
          {rest.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{
                backgroundColor: 'white', border: '1px solid #eee', height: '100%',
                display: 'flex', flexDirection: 'column'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A961'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; }}>
                {post.image && (
                  <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={post.image} alt={post.title} loading="lazy"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#999', marginBottom: '0.6rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {readingTime(post)} perc
                    </span>
                  </div>
                  <h2 style={{ color: '#0F2A1D', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontFamily: 'Georgia, serif', lineHeight: 1.3 }}>
                    {post.title}
                  </h2>
                  <p style={{ color: '#666', fontSize: '0.9rem', flex: 1, lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                    {post.excerpt}
                  </p>
                  <div style={{ marginBottom: '0.85rem' }}>
                    {(post.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        display: 'inline-block', marginRight: '0.4rem', marginBottom: '0.3rem',
                        padding: '0.18rem 0.5rem', backgroundColor: '#eef1ee', borderRadius: 0,
                        color: '#0F2A1D', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span style={{ color: '#0F2A1D', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Tovább olvasom →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
