import { useEffect, useState } from 'react';
import { getStats } from '../api';

const STATUS_COLORS = {
  'Not Called': '#64748b', 'Called - No Answer': '#fbbf24', 'Interested': '#3b82f6',
  'Not Interested': '#f87171', 'Follow Up': '#a78bfa', 'Converted': '#22c55e', 'Closed Deal': '#10b981',
};

const s = {
  wrap: { padding: 24 },
  section: { marginBottom: 32 },
  h2: { fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 14 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  badge: (color) => ({ background: color + '22', border: `1px solid ${color}`, color, borderRadius: 8, padding: '4px 12px', fontFamily: 'DM Mono, monospace', fontSize: 13 }),
  card: { background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 18px', marginBottom: 10 },
  name: { fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 14, fontWeight: 600, marginBottom: 6 },
  meta: { fontFamily: 'DM Mono, monospace', color: '#64748b', fontSize: 12, marginBottom: 8 },
  bar: (pct) => ({ height: 6, borderRadius: 3, background: `linear-gradient(90deg, #3b82f6 ${pct}%, #1e293b ${pct}%)` }),
};

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => { getStats().then(setStats).catch(console.error); }, []);

  if (!stats) return <div style={{ color: '#64748b', padding: 24, fontFamily: 'DM Mono, monospace' }}>Loading…</div>;

  return (
    <div style={s.wrap}>
      <div style={s.section}>
        <div style={s.h2}>By Status</div>
        <div style={s.badgeRow}>
          {stats.byStatus.map(r => (
            <span key={r.status} style={s.badge(STATUS_COLORS[r.status] || '#64748b')}>
              {r.status} — {r.count}
            </span>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.h2}>By Team Member</div>
        {stats.byMember.map(r => {
          const pct = r.total > 0 ? Math.round((r.converted / r.total) * 100) : 0;
          return (
            <div key={r.assigned_to} style={s.card}>
              <div style={s.name}>{r.assigned_to}</div>
              <div style={s.meta}>Total: {r.total} · Interested: {r.interested} · Converted: {r.converted}</div>
              <div style={s.bar(pct)} />
            </div>
          );
        })}
      </div>

      <div style={s.section}>
        <div style={s.h2}>By Category</div>
        {stats.byCategory.map(r => {
          const pct = r.total > 0 ? Math.round((r.called / r.total) * 100) : 0;
          return (
            <div key={r.category} style={s.card}>
              <div style={s.name}>{r.category}</div>
              <div style={s.meta}>Total: {r.total} · Called: {r.called} ({pct}%)</div>
              <div style={s.bar(pct)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
