import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Calendar, User } from 'lucide-react';
import { getBlogPosts } from '../data/storage';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    document.title = 'Blog - MunkavédelmiShop';
    setPosts(getBlogPosts());

    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setMeta('description', 'Munkavédelmi blog: szabványok, tanácsok, útmutatók. Hogyan válassz munkacipőt, kesztyűt, hi-vis ruhát.');
  }, []);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{
        backgroundColor: 'white', padding: '1rem 1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
            🛡️ MunkavédelmiShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      <div style={{
        background: 'linear-gradient(135deg, #0F2A1D 0%, #1a3f33 100%)',
        color: 'white', padding: '3rem 1.5rem', textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontFamily: 'Georgia, serif' }}>📝 Munkavédelmi Blog</h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: '0.5rem' }}>
          Útmutatók, szabványok, tanácsok a munkavédelem világából
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'
        }}>
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{
                backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%',
                display: 'flex', flexDirection: 'column', transition: 'all 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {post.image && (
                  <img src={post.image} alt={post.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                )}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {new Date(post.date).toLocaleDateString('hu-HU')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} /> {post.author}
                    </span>
                  </div>
                  <h2 style={{ color: '#0F2A1D', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>
                    {post.title}
                  </h2>
                  <p style={{ color: '#666', fontSize: '0.95rem', flex: 1, lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ marginTop: '1rem' }}>
                    {(post.tags || []).map(tag => (
                      <span key={tag} style={{
                        display: 'inline-block', marginRight: '0.5rem', marginBottom: '0.25rem',
                        padding: '0.15rem 0.5rem', backgroundColor: '#f5f5f5',
                        color: '#666', fontSize: '0.75rem', borderRadius: '4px'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: '#C9A961', fontWeight: 'bold', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Tovább olvasom <ChevronRight size={16} />
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', padding: '3rem' }}>Még nincs blog poszt.</p>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
