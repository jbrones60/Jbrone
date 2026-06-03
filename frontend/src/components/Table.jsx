import { useState } from 'react';
import { updateLead } from '../api';

const PAGE_SIZE = 30;

const STATUS_OPTIONS = ['Not Called', 'Called - No Answer', 'Interested', 'Not Interested', 'Follow Up', 'Converted', 'Closed Deal'];
const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#64748b' };

const s = {
  wrap: { padding: '0 24px 24px' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace', fontSize: 13 },
  th: { color: '#64748b', fontWeight: 600, padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' },
  td: { color: '#cbd5e1', padding: '9px 12px', borderBottom: '1px solid #1e293b', verticalAlign: 'middle' },
  trHover: { cursor: 'pointer' },
  select: { background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 6, padding: '3px 6px', fontFamily: 'DM Mono, monospace', fontSize: 12 },
  pager: { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', padding: '14px 0', fontFamily: 'DM Mono, monospace', color: '#64748b', fontSize: 13 },
  btn: (active) => ({ background: active ? '#3b82f6' : '#111827', border: '1px solid #1e293b', color: active ? '#fff' : '#64748b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 13 }),
};

function getFollowUpBadge(dateStr) {
  if (!dateStr) return { label: '—', color: '#64748b' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  const diff = (date - today) / 86400000;
  if (diff === 0) return { label: 'Today', color: '#22c55e' };
  if (diff > 0 && diff <= 7) return { label: 'This week', color: '#f59e0b' };
  if (diff < 0) return { label: 'Overdue', color: '#f87171' };
  return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#94a3b8' };
}

export default function Table({ leads, onSelectLead, onLeadUpdate }) {
  const [page, setPage] = useState(1);
  const total = leads.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleInlineChange(lead, field, value) {
    try {
      const updated = await updateLead(lead.id, { [field]: value });
      onLeadUpdate(updated);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={s.wrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {['#', 'Name', 'Category', 'Phone', 'Website', 'Priority', 'Status', 'Follow Up'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.map((lead, i) => {
            const badge = getFollowUpBadge(lead.follow_up_date);
            return (
              <tr key={lead.id} style={s.trHover} onClick={() => onSelectLead(lead)}>
                <td style={s.td}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td style={{ ...s.td, color: '#f1f5f9', fontWeight: 500 }}>{lead.name}</td>
                <td style={s.td}>{lead.category}</td>
                <td style={s.td}>
                  <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                    {lead.phone}
                  </a>
                </td>
                <td style={s.td}>{lead.has_website ? <span style={{ color: '#22c55e' }}>Yes</span> : <span style={{ color: '#f87171' }}>No</span>}</td>
                <td style={s.td}>
                  <span style={{ color: PRIORITY_COLOR[lead.priority] || '#64748b' }}>{lead.priority}</span>
                </td>
                <td style={s.td} onClick={e => e.stopPropagation()}>
                  <select style={s.select} value={lead.status} onChange={e => handleInlineChange(lead, 'status', e.target.value)}>
                    {STATUS_OPTIONS.map(st => <option key={st}>{st}</option>)}
                  </select>
                </td>
                <td style={s.td}>
                  <span style={{ background: badge.color + '33', color: badge.color, borderRadius: 4, padding: '2px 8px', fontFamily: 'DM Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={s.pager}>
        <span>{total} leads</span>
        <button style={s.btn(false)} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
        <span>{page} / {pages}</span>
        <button style={s.btn(false)} disabled={page === pages} onClick={() => setPage(p => p + 1)}>→</button>
      </div>
    </div>
  );
}
