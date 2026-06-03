import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Table from './components/Table';
import Kanban from './components/Kanban';
import Stats from './components/Stats';
import { getLeads, updateLead, exportBackup } from './api';

const CATEGORIES = ['schools', 'Real Estate', 'interior designs', 'law', 'CA'];
const MEMBERS = ['', 'Ravi', 'Priya', 'Suresh'];
const STATUSES = ['', 'Not Called', 'Called - No Answer', 'Interested', 'Not Interested', 'Follow Up', 'Converted', 'Closed Deal'];
const PRIORITIES = ['high', 'medium', 'low'];
const STATUS_QUICK = ['Not Called', 'Interested', 'Follow Up', 'Converted'];
const EMPTY_FILTERS = { search: '', category: '', assigned_to: '', status: '', priority: '', website: '' };

const CATEGORY_COLORS = {
  'schools': '#3b82f6',
  'Real Estate': '#22c55e',
  'interior designs': '#a855f7',
  'law': '#f59e0b',
  'CA': '#ef4444',
};

const s = {
  app: { minHeight: '100vh', background: '#080c14', color: '#f1f5f9' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '1px solid #1e293b', background: '#111827' },
  logo: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  user: { fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#64748b' },
  logoutBtn: { background: 'none', border: '1px solid #1e293b', color: '#64748b', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 12, marginLeft: 12 },
  backupBtn: { background: 'none', border: '1px solid #1e293b', color: '#3b82f6', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 12, marginLeft: 12 },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', background: '#111827' },
  tab: (active) => ({ padding: '12px 24px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', color: active ? '#3b82f6' : '#64748b', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent' }),
  filterBar: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 24px', borderBottom: '1px solid #1e293b', background: '#0d1117' },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { background: '#111827', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 20, padding: '6px 14px', fontFamily: 'DM Mono, monospace', fontSize: 13, width: 220, outline: 'none' },
  quickPill: (active) => ({ background: active ? '#3b82f6' : '#111827', color: active ? '#fff' : '#64748b', border: `1px solid ${active ? '#3b82f6' : '#1e293b'}`, borderRadius: 20, padding: '4px 14px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 12, whiteSpace: 'nowrap' }),
  filterSelect: { background: '#111827', border: '1px solid #1e293b', color: '#64748b', borderRadius: 20, padding: '4px 12px', fontFamily: 'DM Mono, monospace', fontSize: 12, cursor: 'pointer' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '3px 10px', fontFamily: 'DM Mono, monospace', fontSize: 12 },
  chipRemove: { background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 },
  clearAll: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: 12, textDecoration: 'underline', padding: 0 },
  label: { display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b', marginBottom: 5 },
  mInput: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13, boxSizing: 'border-box' },
  mSelect: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13 },
  textarea: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#64748b', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, cursor: 'pointer' },
};

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    status: lead.status,
    priority: lead.priority,
    notes: lead.notes || '',
    follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try { await onSave(lead.id, form); onClose(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  const catColor = CATEGORY_COLORS[lead.category] || '#64748b';
  const websiteUrl = lead.website && (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 520,
        background: '#111827', borderLeft: '1px solid #1e293b',
        borderRadius: '12px 0 0 12px', zIndex: 100, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }}>

        {/* Top: read-only info */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, flex: 1, marginRight: 12 }}>
              {lead.name}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
          </div>

          <span style={{ background: catColor + '22', color: catColor, border: `1px solid ${catColor}44`, borderRadius: 20, padding: '3px 12px', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
            {lead.category}
          </span>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}>
              <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                📞 {lead.phone}
              </a>
            </div>
            {lead.address && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#64748b' }}>
                📍 {lead.address}
              </div>
            )}
            {lead.has_website && websiteUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#22c55e', textDecoration: 'none' }}>
                  🌐 {lead.website}
                </a>
                <a
                  href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(websiteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#f59e0b', textDecoration: 'none', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}
                >
                  Check Site Score →
                </a>
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, background: '#0d1117', borderRadius: 8, padding: '10px 14px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b' }}>
            {lead.has_website
              ? 'They have a website — pitch redesign, SEO audit, or performance improvement.'
              : 'No website detected — pitch a new website build from scratch.'}
          </div>
        </div>

        {/* Bottom: editable fields */}
        <div style={{ padding: '20px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={s.label}>Status</label>
              <select style={s.mSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.filter(Boolean).map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Priority</label>
              <select style={s.mSelect} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={s.label}>Follow-up Date</label>
            <input style={s.mInput} type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
          </div>

          <div style={{ flex: 1 }}>
            <label style={s.label}>Notes</label>
            <textarea style={{ ...s.textarea, minHeight: 130 }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={s.btnRow}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [tab, setTab] = useState('Table');
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getLeads(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))
      .then(data => setLeads(data.leads ?? data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, filters]);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  function handleLeadUpdate(updated) {
    setLeads(ls => ls.map(l => l.id === updated.id ? updated : l));
  }

  async function handleSave(id, data) {
    const updated = await updateLead(id, data);
    handleLeadUpdate(updated);
  }

  if (!user) return <Login onLogin={u => setUser(u)} />;

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>Agency CRM</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={s.user}>{user.name}</span>
          <button style={s.backupBtn} onClick={() => exportBackup().catch(console.error)}>Download Backup</button>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={s.tabs}>
        {['Table', 'Kanban', 'Stats'].map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab !== 'Stats' && (
        <div style={s.filterBar}>
          <div style={s.filterRow}>
            <input
              style={s.searchInput}
              placeholder="Search name or phone…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
            {hasActiveFilters && (
              <button style={s.clearAll} onClick={() => setFilters(EMPTY_FILTERS)}>Clear All</button>
            )}
          </div>

          <div style={s.filterRow}>
            {STATUS_QUICK.map(st => (
              <button
                key={st}
                style={s.quickPill(filters.status === st)}
                onClick={() => setFilter('status', filters.status === st ? '' : st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={s.filterRow}>
            {filters.category ? (
              <span style={s.chip}>
                Category: {filters.category}
                <button style={s.chipRemove} onClick={() => setFilter('category', '')}>✕</button>
              </span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('category', e.target.value)}>
                <option value="">Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {filters.priority ? (
              <span style={s.chip}>
                Priority: {filters.priority}
                <button style={s.chipRemove} onClick={() => setFilter('priority', '')}>✕</button>
              </span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('priority', e.target.value)}>
                <option value="">Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}

            {filters.website ? (
              <span style={s.chip}>
                {filters.website === 'has' ? 'Has Website' : 'No Website'}
                <button style={s.chipRemove} onClick={() => setFilter('website', '')}>✕</button>
              </span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('website', e.target.value)}>
                <option value="">Website</option>
                <option value="has">Has Website</option>
                <option value="none">No Website</option>
              </select>
            )}

            {filters.status && !STATUS_QUICK.includes(filters.status) && (
              <span style={s.chip}>
                Status: {filters.status}
                <button style={s.chipRemove} onClick={() => setFilter('status', '')}>✕</button>
              </span>
            )}
          </div>
        </div>
      )}

      {loading && <div style={{ padding: 24, fontFamily: 'DM Mono, monospace', color: '#64748b' }}>Loading…</div>}
      {!loading && tab === 'Table' && <Table leads={leads} onSelectLead={setSelectedLead} onLeadUpdate={handleLeadUpdate} />}
      {!loading && tab === 'Kanban' && <Kanban leads={leads} onSelectLead={setSelectedLead} />}
      {tab === 'Stats' && <Stats />}
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={handleSave} />}
    </div>
  );
}
