import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { setMetaTag, setCanonical } from '../utils/seo';

// GYIK oldal - GEO/SEO: FAQPage schema.org markup-pal, hogy a keresok es
// AI-asszisztensek strukturaltan ertelmezzek a valaszokat
const FAQS = [
  {
    q: 'Mennyi a szállítási idő és a szállítási költség?',
    a: 'Rendelésedet 2-3 munkanapon belül kézbesítjük országosan futárszolgálattal (1 290 Ft), vagy 2-4 munkanapon belül Foxpost csomagautomatába (990 Ft). 30 000 Ft feletti rendelésnél a kiszállítás mindkét módon ingyenes.'
  },
  {
    q: 'Milyen munkavédelmi cipő kategóriát válasszak (S1, S1P, S2, S3)?',
    a: 'Az S1 beltéri, száraz környezetbe való (orrmerevítő + antisztatikus talp). Az S1P átszúrás elleni talplemezt is tartalmaz — műhelybe, építkezésre. Az S2 vízálló felsőrészt ad, az S3 pedig mindezt együtt: vízálló, átszúrásbiztos, profilos talpú — kültéri és ipari munkához ezt ajánljuk. Részletes útmutató a blogunkban található.'
  },
  {
    q: 'Ki fizeti a munkavédelmi eszközöket: a munkáltató vagy a dolgozó?',
    a: 'A munkavédelmi törvény szerint az egyéni védőeszközt a munkáltató köteles biztosítani, saját költségén. A védőeszköz-juttatás rendjét 2024-től írásban kell rögzíteni munkakörönként. Cégünk, a Trident Shield Group Kft. ebben szolgáltatásként is segít.'
  },
  {
    q: 'Hogyan válasszak méretet?',
    a: 'Lábbeliknél a megszokott utcai méretedet válaszd; téli, vastag zoknis viselethez fél számmal nagyobbat. Ruházatnál a Portwest európai méretezést használ (S-4XL) — kétség esetén a termékoldalon lévő méretek közül a nagyobbat ajánljuk. Ha nem jó a méret, cseréljük.'
  },
  {
    q: 'Vissza tudom küldeni vagy cserélni a terméket?',
    a: 'Igen, a hatályos fogyasztóvédelmi szabályok szerint 14 napon belül indoklás nélkül elállhatsz a vásárlástól, a terméket pedig cseréljük vagy visszatérítjük az árát. A részleteket az ÁSZF tartalmazza.'
  },
  {
    q: 'Kapok számlát a rendelésről?',
    a: 'Igen, minden rendelésről áfás számlát állítunk ki (cégeknek céges adatokkal), amelyet a rendelés visszaigazolásával együtt küldünk.'
  },
  {
    q: 'Nagyobb tételben, céges beszerzésként is rendelhetek?',
    a: 'Természetesen — céges és intézményi megrendeléseket is kiszolgálunk, nagyobb tételnél egyedi árajánlatot adunk. Írj az iroda@tuz-munkavedelmiszaki.hu címre vagy hívd a +36 30 272 2571 számot.'
  },
  {
    q: 'Eredeti Portwest termékeket forgalmaztok?',
    a: 'Igen, kizárólag eredeti, CE minősítésű Portwest termékeket értékesítünk hivatalos magyarországi beszállítói háttérrel. Minden termék megfelel a vonatkozó EU-szabványoknak (pl. EN ISO 20345 lábbelik, EN 388 kesztyűk, EN ISO 20471 láthatósági ruházat, EN 397 sisakok).'
  },
  {
    q: 'Hol található az üzletetek?',
    a: 'Központunk: 4030 Debrecen, Keleti Ipartelep utca 4. A webshopból az egész országba szállítunk. Nyitvatartás: hétfő-péntek 8:00-17:00.'
  },
  {
    q: 'Munkavédelmi szolgáltatásokat is nyújtotok?',
    a: 'Igen — a Trident Shield Group Kft. (MunkavédelmiSzaki) teljes körű munkavédelmi és tűzvédelmi szolgáltatást nyújt: kockázatértékelés, munkavédelmi oktatás, tűzvédelmi szabályzat és egyéni védőeszköz juttatási rend készítése magyar KKV-knak.'
  }
];

const FaqPage = () => {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    document.title = 'Gyakori kérdések (GYIK) | TridentShop';
    setMetaTag('description', 'Szállítás, méretválasztás, munkacipő-kategóriák, számlázás és csere-visszaküldés — a TridentShop leggyakoribb vásárlói kérdései egy helyen.');
    setCanonical('/gyik');
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQS.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
      }))
    };
    let s = document.querySelector('script[data-faq]');
    if (!s) {
      s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-faq', 'true');
      document.head.appendChild(s);
    }
    s.textContent = JSON.stringify(schema);
    return () => { if (s && s.parentNode) s.parentNode.removeChild(s); };
  }, []);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: 'white', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
            🛡️ TridentShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif' }}>❓ Gyakori kérdések</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Összegyűjtöttük a leggyakoribb kérdéseket a rendelésről, szállításról és a munkavédelmi termékek kiválasztásáról.
        </p>

        {FAQS.map((f, i) => (
          <div key={i} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: '100%', padding: '1rem 1.25rem', backgroundColor: 'white', border: 'none',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', color: '#0F2A1D'
            }}>
              {f.q}
              <ChevronDown size={18} style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: '0.75rem', color: '#C9A961' }} />
            </button>
            {open === i && (
              <div style={{ padding: '0 1.25rem 1rem 1.25rem', color: '#444', lineHeight: 1.6 }}>
                {f.a}
              </div>
            )}
          </div>
        ))}

        <div style={{ backgroundColor: '#0F2A1D', color: 'white', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Nem találod a választ?</p>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Hívj minket: <strong style={{ color: '#C9A961' }}>+36 30 272 2571</strong> · iroda@tuz-munkavedelmiszaki.hu
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
