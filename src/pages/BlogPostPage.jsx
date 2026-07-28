import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ChevronRight, Clock, ShoppingCart, ChevronDown } from 'lucide-react';
import { getBlogPostBySlug, getBlogPosts, getVisibleProducts } from '../data/storage';
import { readingTime } from './BlogPage';

// Cikkhez kapcsolódó termékek: tag- és cím-kulcsszavak alapján pontozunk,
// a legjobb listaár-kedvezményű találatokat ajánljuk (max 4)
const KEYWORD_MAP = [
  { keys: ['munkacipo', 'cipő', 'cipo', 'lábbeli', 'labbeli', 'bakancs'], cats: ['munkacipo', 'bakancs'] },
  { keys: ['kesztyu', 'kesztyű'], cats: ['kesztyu'] },
  { keys: ['hi-vis', 'lathatosag', 'láthatóság', 'jól láthatósági'], cats: ['munkaruha'] },
  { keys: ['sisak', 'szemuveg', 'szemüveg', 'fülvédő', 'fultok', 'légzésvédő', 'legzesvedo'], cats: ['kiegeszitok'] },
  { keys: ['munkaruha', 'nadrág', 'nadrag', 'kabát', 'kabat', 'overál', 'overal', 'ruha'], cats: ['munkaruha'] }
];

const relatedProducts = (post) => {
  const haystack = ((post.tags || []).join(' ') + ' ' + post.title).toLowerCase();
  const cats = new Set();
  KEYWORD_MAP.forEach(m => { if (m.keys.some(k => haystack.includes(k))) m.cats.forEach(c => cats.add(c)); });
  let pool = getVisibleProducts().filter(p => cats.size === 0 || cats.has(p.categoryId));
  const discount = (p) => {
    if (!(p.partnerPrice > 0)) return 0;
    const lp = Math.round(p.partnerPrice / 0.7608 / 10) * 10;
    return lp > p.price ? (1 - p.price / lp) : 0;
  };
  return pool.sort((a, b) => discount(b) - discount(a)).slice(0, 4);
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [otherPosts, setOtherPosts] = useState([]);
  const [recos, setRecos] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const p = getBlogPostBySlug(slug);
    if (!p) {
      navigate('/blog');
      return;
    }
    setPost(p);
    // Kapcsolódó cikkek: előbb az azonos témájúak (közös tag), aztán a többi
    const myTags = new Set(p.tags || []);
    const others = getBlogPosts().filter(other => other.id !== p.id);
    const sameTopic = others.filter(o => (o.tags || []).some(t => myTags.has(t)));
    const rest = others.filter(o => !(o.tags || []).some(t => myTags.has(t)));
    setOtherPosts([...sameTopic, ...rest].slice(0, 3));
    setRecos(relatedProducts(p));
    window.scrollTo({ top: 0 });

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

    // Schema.org Article (+ FAQPage, ha a cikknek van GYIK-je)
    const wordCount = (p.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const schemas = [{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": p.title,
      "image": absImage,
      "datePublished": p.date,
      "wordCount": wordCount,
      "articleSection": (p.tags || [])[0] || 'munkavédelem',
      "author": { "@type": "Organization", "name": p.author },
      "publisher": { "@type": "Organization", "name": "MunkavédelmiShop" }
    }];
    if (Array.isArray(p.faq) && p.faq.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": p.faq.map(f => ({
          "@type": "Question", "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      });
    }

    let schemaScript = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-blog', 'true');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schemas);

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

        <div style={{ display: 'flex', gap: '1rem', color: '#999', marginBottom: '1rem', fontSize: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(post.tags || [])[0] && (
            <span style={{ backgroundColor: '#0F2A1D', color: '#C9A961', padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {(post.tags || [])[0]}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} /> {new Date(post.date).toLocaleDateString('hu-HU')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> {readingTime(post.content)} perc olvasás
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={14} /> {post.author}
          </span>
        </div>

        <h1 style={{ color: '#0F2A1D', fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.3 }}>
          {post.title}
        </h1>

        {/* "Röviden" bevezető-doboz */}
        <div style={{ backgroundColor: '#eef2ef', borderLeft: '4px solid #C9A961', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', marginBottom: '2rem' }}>
          <strong style={{ color: '#0F2A1D' }}>Röviden:</strong>{' '}
          <span style={{ color: '#444' }}>{post.excerpt}</span>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', lineHeight: 1.7, color: '#333' }}
          dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Kapcsolódó termékek — a cikk témájához illő legjobb ajánlatok */}
        {recos.length > 0 && (
          <div style={{ backgroundColor: '#0F2A1D', borderRadius: '8px', padding: '1.5rem', marginTop: '2rem' }}>
            <h2 style={{ color: 'white', margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontFamily: 'Georgia, serif' }}>
              🛒 A cikkhez ajánljuk
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              Válogatás a webshopból — listaár alatti árakkal.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {recos.map(p => (
                <Link key={p.id} to={`/termek/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '6px', overflow: 'hidden', height: '100%' }}>
                    <img src={p.image} alt={p.name} loading="lazy" style={{ width: '100%', height: '110px', objectFit: 'contain', backgroundColor: '#fafafa' }} />
                    <div style={{ padding: '0.6rem' }}>
                      <div style={{ color: '#333', fontSize: '0.78rem', height: '2.4em', overflow: 'hidden', lineHeight: 1.25 }}>{p.name}</div>
                      <div style={{ color: '#0F2A1D', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                        {((p.sale && p.sale.active) ? p.sale.price : p.price).toLocaleString('hu-HU')} Ft
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#C9A961', color: '#0F2A1D', padding: '0.6rem 1.25rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', marginTop: '1rem', fontSize: '0.9rem' }}>
              <ShoppingCart size={16} /> Tovább a webshopba
            </Link>
          </div>
        )}

        {/* GYIK (ha a cikkhez tartozik) */}
        {Array.isArray(post.faq) && post.faq.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#0F2A1D' }}>❓ Gyakori kérdések</h2>
            {post.faq.map((f, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%', padding: '0.9rem 1.1rem', backgroundColor: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textAlign: 'left', fontSize: '0.95rem', fontWeight: 'bold', color: '#0F2A1D'
                }}>
                  {f.q}
                  <ChevronDown size={16} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: '0.5rem', color: '#C9A961' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.1rem 0.9rem', color: '#444', lineHeight: 1.6, fontSize: '0.92rem' }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        )}

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

        {/* Szerző-blokk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'white', borderRadius: '8px', padding: '1.25rem', marginTop: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem' }}>🛡️</div>
          <div>
            <div style={{ color: '#0F2A1D', fontWeight: 'bold' }}>{post.author}</div>
            <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>
              A MunkavédelmiShop a Trident Shield Group Kft. webáruháza — munkavédelmi szakemberek
              válogatják a termékeket és írják az útmutatókat. Kérdésed van? Hívj: +36 30 272 2571
            </div>
          </div>
        </div>
      </article>

      {otherPosts.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '3rem auto 2rem', padding: '0 1.5rem' }}>
          <h2 style={{ color: '#0F2A1D' }}>📚 Kapcsolódó cikkek</h2>
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
                    <img src={p.image} alt={p.title} loading="lazy" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ color: '#0F2A1D', fontSize: '1rem', margin: 0 }}>{p.title}</h3>
                    <div style={{ color: '#999', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                      {readingTime(p.content)} perc olvasás
                    </div>
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
