const COLUMNS = ['Not Called', 'Called - No Answer', 'Interested', 'Follow Up', 'Converted'];

const PRIORITY_DOT = { high: '#f87171', medium: '#fbbf24', low: '#334155' };

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
  'schools':          '#3b82f6',
  'Real Estate':      '#22c55e',
  'interior designs': '#a855f7',
  'law':              '#f59e0b',
  'CA':               '#ef4444',
};

const s = {
  board: { display: 'flex', gap: 12, padding: 24, overflowX: 'auto', minHeight: 'calc(100vh - 160px)' },
  col: { minWidth: 220, flex: '0 0 220px', background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: 12 },
  colHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  card: { background: '#080c14', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' },
  cardName: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#f1f5f9', fontSize: 13, fontWeight: 700, marginBottom: 6 },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  assignee: { fontFamily: 'Inter, sans-serif', color: '#64748b', fontSize: 11 },
};

export default function Kanban({ leads, onSelectLead }) {
  return (
    <div style={s.board}>
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.status === col);
        const statusColor = STATUS_COLORS[col] || '#94a3b8';
        return (
          <div key={col} style={s.col}>
            <div style={s.colHead}>
              <span style={{ background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}33`, borderRadius: 20, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>
                {col}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', color: '#475569', fontSize: 11 }}>{colLeads.length}</span>
            </div>
            {colLeads.map(lead => {
              const catColor = CATEGORY_COLORS[lead.category] || '#64748b';
              return (
                <div key={lead.id} style={s.card} onClick={() => onSelectLead(lead)}>
                  <div style={s.cardName}>{lead.name}</div>
                  <div style={s.cardMeta}>
                    <div style={s.dot(PRIORITY_DOT[lead.priority] || '#334155')} />
                    <span style={{ fontFamily: 'Inter, sans-serif', color: catColor, fontSize: 11 }}>{lead.category}</span>
                    {lead.assigned_to && <span style={s.assignee}>· {lead.assigned_to}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
