import { useEffect, useState } from 'react';
import { getStats, importLeads } from '../api';

const STATUS_COLORS = {
  'Not Called':         '#94a3b8',
  'Called - No Answer': '#94a3b8',
  'Interested':         '#22c55e',
  'Not Interested':     '#f87171',
  'Follow Up':          '#3b82f6',
  'Converted':          '#a855f7',
  'Closed Deal':        '#f59e0b',
};

const CATEGORY_COLORS = {
  'schools': '#3b82f6', 'Real Estate': '#22c55e', 'interior designs': '#a855f7',
  'law': '#f59e0b', 'CA': '#ef4444',
};

const KPI_CONFIG = [
  { key: 'total',      label: 'Total Leads',  color: '#3b82f6', derive: (s) => s.reduce((a, r) => a + parseInt(r.count), 0) },
  { key: 'interested', label: 'Interested',   color: '#22c55e', derive: (s) => parseInt(s.find(r => r.status === 'Interested')?.count || 0) },
  { key: 'converted',  label: 'Converted',    color: '#a855f7', derive: (s) => parseInt(s.find(r => r.status === 'Converted')?.count || 0) },
  { key: 'notcalled',  label: 'Not Called',   color: '#64748b', derive: (s) => parseInt(s.find(r => r.status === 'Not Called')?.count || 0) },
];

function ImportSection() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await importLeads(file);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Import Leads</div>
      <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <span style={{ background: '#0d1117', border: '1px solid #334155', borderRadius: 6, padding: '6px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: file ? '#f1f5f9' : '#475569', whiteSpace: 'nowrap' }}>
            {file ? file.name : 'Choose CSV…'}
          </span>
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(''); }} />
        </label>
        <button
          onClick={handleImport}
          disabled={!file || loading}
          style={{ background: file && !loading ? '#3b82f6' : '#1e293b', color: file && !loading ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: file && !loading ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Importing…' : 'Import CSV'}
        </button>
        {result && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>{result.inserted} inserted</span>
            <span style={{ color: '#334155' }}> · </span>
            <span style={{ color: '#f59e0b' }}>{result.skipped} skipped</span>
          </span>
        )}
        {error && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#f87171' }}>{error}</span>}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#475569', marginTop: 8 }}>
        Required columns: <span style={{ color: '#64748b' }}>name</span>, <span style={{ color: '#64748b' }}>category</span> · Optional: phone, address, website, type · Rows with duplicate phone numbers are skipped
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => { getStats().then(setStats).catch(console.error); }, []);

  if (!stats) return <div style={{ color: '#64748b', padding: 24, fontFamily: 'Inter, sans-serif' }}>Loading…</div>;

  const totalLost = (stats.byLostReason || []).reduce((a, r) => a + parseInt(r.count), 0);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {KPI_CONFIG.map(({ key, label, color, derive }) => (
          <div key={key} style={{ background: '#111827', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 38, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
              {derive(stats.byStatus)}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* By Category */}
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>By Category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.byCategory.map(r => {
              const pct = r.total > 0 ? Math.round((r.called / r.total) * 100) : 0;
              const color = CATEGORY_COLORS[r.category] || '#64748b';
              return (
                <div key={r.category} style={{ background: '#111827', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{r.category}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#64748b' }}>{r.called}/{r.total} called · {pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status */}
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>By Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.byStatus.sort((a, b) => b.count - a.count).map(r => {
              const color = STATUS_COLORS[r.status] || '#64748b';
              return (
                <div key={r.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ background: color + '1a', color, border: `1px solid ${color}33`, borderRadius: 20, padding: '3px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                    {r.status}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Leads Say No */}
      {stats.byLostReason && stats.byLostReason.length > 0 && (
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Why Leads Say No</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.byLostReason.map(r => {
              const pct = totalLost > 0 ? Math.round((parseInt(r.count) / totalLost) * 100) : 0;
              return (
                <div key={r.lost_reason} style={{ background: '#111827', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94a3b8' }}>{r.lost_reason}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>{r.count} · {pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#f87171', borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ImportSection />
    </div>
  );
}
