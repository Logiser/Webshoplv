import React, { useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

// Mérettáblázat felugró ablak. A termék kategóriája alapján kapott
// chart objektumot jeleníti meg (src/data/sizeCharts.js).
const SizeChartModal = ({ chart, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!chart) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '10px', maxWidth: '760px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{
          position: 'sticky', top: 0, backgroundColor: '#0F2A1D', color: 'white',
          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderRadius: '10px 10px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ruler size={20} color="#C9A961" /> {chart.title}
          </h2>
          <button onClick={onClose} aria-label="Bezárás" style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: '0.25rem'
          }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <p style={{ color: '#555', lineHeight: 1.6, marginTop: 0 }}>{chart.intro}</p>

          <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '420px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0F2A1D', color: 'white' }}>
                  {chart.columns.map(c => (
                    <th key={c} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 ? '#fafaf8' : 'white' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{
                        padding: '0.55rem 0.75rem', borderBottom: '1px solid #eee',
                        fontWeight: j === 0 ? 'bold' : 'normal',
                        color: j === 0 ? '#0F2A1D' : '#444', whiteSpace: 'nowrap'
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chart.tips && chart.tips.length > 0 && (
            <div style={{ backgroundColor: '#f5f7f5', borderLeft: '4px solid #C9A961', padding: '0.9rem 1rem', borderRadius: '4px' }}>
              <strong style={{ color: '#0F2A1D', display: 'block', marginBottom: '0.5rem' }}>Jó tudni</strong>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#444', lineHeight: 1.7 }}>
                {chart.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 0, marginTop: '1rem' }}>
            Nem biztos a méret? Írj az <a href="mailto:iroda@tuz-munkavedelmiszaki.com" style={{ color: '#0F2A1D' }}>iroda@tuz-munkavedelmiszaki.com</a> címre,
            vagy hívj: <strong>+36 30 272 2571</strong>. Ha mégsem jó, 14 napon belül cseréljük.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
