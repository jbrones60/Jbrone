const COLUMNS = ['Not Called', 'Called - No Answer', 'Interested', 'Follow Up', 'Converted'];

const PRIORITY_DOT = { high: '#f87171', medium: '#fbbf24', low: '#64748b' };

const s = {
  board: { display: 'flex', gap: 12, padding: 24, overflowX: 'auto', minHeight: 'calc(100vh - 160px)' },
  col: { minWidth: 220, flex: '0 0 220px', background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: 12 },
  colHead: { fontFamily: 'Space Grotesk, sans-serif', color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: { background: '#080c14', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' },
  cardName: { fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', fontSize: 13, fontWeight: 600, marginBottom: 4 },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  assignee: { fontFamily: 'DM Mono, monospace', color: '#64748b', fontSize: 11 },
};

export default function Kanban({ leads, onSelectLead }) {
  return (
    <div style={s.board}>
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.status === col);
        return (
          <div key={col} style={s.col}>
            <div style={s.colHead}>{col} <span style={{ color: '#3b82f6' }}>({colLeads.length})</span></div>
            {colLeads.map(lead => (
              <div key={lead.id} style={s.card} onClick={() => onSelectLead(lead)}>
                <div style={s.cardName}>{lead.name}</div>
                <div style={s.cardMeta}>
                  <div style={s.dot(PRIORITY_DOT[lead.priority] || '#64748b')} />
                  <span style={s.assignee}>{lead.assigned_to}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
