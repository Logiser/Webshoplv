import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// Nyelvváltó legördülő. A választás localStorage-ban marad meg.
const LanguageSwitcher = ({ compact = false }) => {
  const { lang, setLang, languages } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = languages.find(l => l.code === lang) || languages[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Nyelv választása / Choose language"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'inherit',
          display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.4rem',
          fontSize: '0.85rem'
        }}
      >
        <Globe size={16} />
        <span>{current.flag}</span>
        {!compact && <span>{current.code.toUpperCase()}</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem',
          backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          zIndex: 1200, minWidth: '160px', overflow: 'hidden'
        }}>
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 0.85rem', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: l.code === lang ? '#f5f7f5' : 'white',
                color: '#0F2A1D', fontSize: '0.9rem'
              }}
            >
              <span style={{ fontSize: '1.05rem' }}>{l.flag}</span>
              <span style={{ flex: 1 }}>{l.label}</span>
              {l.code === lang && <Check size={15} color="#4CAF50" />}
            </button>
          ))}
          <div style={{ padding: '0.5rem 0.85rem', borderTop: '1px solid #eee', color: '#999', fontSize: '0.73rem', lineHeight: 1.4 }}>
            A termékleírások magyarul jelennek meg.
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
