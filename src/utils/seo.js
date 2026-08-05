// Megosztott SEO-segédek: canonical link + meta tag kezelés egységesen.
// Korábban minden oldal a sajátját írta újra (ProductDetailPage, BlogPostPage,
// WorkwearShop, FaqPage) - ez összevonja, és hozzáadja a hiányzó canonical/og:url
// dinamikus kezelését, ami korábban csak az index.html-ben volt statikusan
// beállítva ("/") MINDEN oldalra, duplikált-tartalom jelzést küldve a Google-nek.

export const SITE_URL = 'https://tridentshop.hu';

export const setMetaTag = (name, content, isProperty = false) => {
  const attr = isProperty ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

// path: a route-nak megfelelő, / -lel kezdődő útvonal (pl. "/termek/xyz")
export const setCanonical = (path) => {
  let tag = document.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  const url = `${SITE_URL}${path}`;
  tag.setAttribute('href', url);
  setMetaTag('og:url', url, true);
};
