import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ChevronRight } from 'lucide-react';
import { getBlogPostBySlug, getBlogPosts } from '../data/storage';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [otherPosts, setOtherPosts] = useState([]);

  useEffect(() => {
    const p = getBlogPostBySlug(slug);
    if (!p) {
      navigate('/blog');
      return;
    }
    setPost(p);
    setOtherPosts(getBlogPosts().filter(other => other.id !== p.id).slice(0, 3));

    document.title = `${p.title} | MunkavédelmiShop Blog`;

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

    // Relatív képútvonal abszolúttá alakítása (OG + schema.org kötelező)
    const absImage = p.image ? ((p.image.startsWith('http') ? p.image : `${window.location.origin}${p.image}`)) : null;
    setMeta('description', p.excerpt);
    setMeta('og:title', p.title, true);
    setMeta('og:description', p.excerpt, true);
    if (absImage) setMeta('og:image', absImage, true);
    setMeta('og:type', 'article', true);

    // Schema.org Article markup
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": p.title,
      "image": absImage,
      "datePublished": p.date,
      "author": { "@type": "Organization", "name": p.author },
      "publisher": { "@type": "Organization", "name": "MunkavédelmiShop" }
    };

    let schemaScript = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-blog', 'true');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);

    return () => {
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [slug, navigate]);

  if (!post) return null;

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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/blog" style={{ color: '#0F2A1D', textDecoration: 'none' }}>Blog</Link>
            <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Webshop
            </Link>
          </div>
        </div>
      </header>

      <div style={{ backgroundColor: 'white', padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>Főoldal</Link>
          <ChevronRight size={14} />
          <Link to="/blog" style={{ color: '#0F2A1D', textDecoration: 'none' }}>Blog</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#C9A961', fontWeight: 'bold' }}>{post.title}</span>
        </div>
      </div>

      <article style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {post.image && (
          <img src={post.image} alt={post.title}
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '2rem' }} />
        )}

        <div style={{ display: 'flex', gap: '1rem', color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} /> {new Date(post.date).toLocaleDateString('hu-HU')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={14} /> {post.author}
          </span>
        </div>

        <h1 style={{ color: '#0F2A1D', fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.3 }}>
          {post.title}
        </h1>

        <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem', fontStyle: 'italic', borderLeft: '3px solid #C9A961', paddingLeft: '1rem' }}>
          {post.excerpt}
        </p>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', lineHeight: 1.7, color: '#333' }}
          dangerouslySetInnerHTML={{ __html: post.content }} />

        <div style={{ marginTop: '2rem' }}>
          {(post.tags || []).map(tag => (
            <span key={tag} style={{
              display: 'inline-block', marginRight: '0.5rem', marginBottom: '0.25rem',
              padding: '0.25rem 0.75rem', backgroundColor: '#fff',
              color: '#0F2A1D', fontSize: '0.85rem', borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              #{tag}
            </span>
          ))}
        </div>
      </article>

      {otherPosts.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '3rem auto 2rem', padding: '0 1.5rem' }}>
          <h2 style={{ color: '#0F2A1D' }}>📚 További cikkek</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem',
            marginTop: '1rem'
          }}>
            {otherPosts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {p.image && (
                    <img src={p.image} alt={p.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ color: '#0F2A1D', fontSize: '1rem', margin: 0 }}>{p.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
