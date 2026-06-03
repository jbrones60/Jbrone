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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  modalSub: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b', marginBottom: 20 },
  fieldRow: { marginBottom: 14 },
  label: { display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b', marginBottom: 5 },
  mInput: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13, boxSizing: 'border-box' },
  mSelect: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13 },
  textarea: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'DM Mono, monospace', fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
  pitch: { background: '#1e293b', borderRadius: 8, padding: '10px 14px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#64748b', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, cursor: 'pointer' },
};

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    status: lead.status, assigned_to: lead.assigned_to, priority: lead.priority,
    notes: lead.notes || '', follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try { await onSave(lead.id, form); onClose(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  const pitch = lead.has_website
    ? 'They have a website — pitch redesign, SEO audit, or performance improvement.'
    : 'No website detected — pitch a new website build from scratch.';

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>{lead.name}</div>
        <div style={s.modalSub}>{lead.category} · {lead.address}</div>
        <div style={s.pitch}> {pitch}</div>
        <div style={s.fieldRow}>
          <label style={s.label}>Phone</label>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}>
            <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6' }}>{lead.phone}</a>
          </div>
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Status</label>
          <select style={s.mSelect} value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.filter(Boolean).map(st => <option key={st}>{st}</option>)}
          </select>
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Assigned To</label>
          <select style={s.mSelect} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
            {MEMBERS.filter(Boolean).map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Priority</label>
          <select style={s.mSelect} value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Follow-up Date</label>
          <input style={s.mInput} type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Notes</label>
          <textarea style={s.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div style={s.btnRow}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
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
          {/* Row 1: Search + Clear All */}
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

          {/* Row 2: Status quick-filter pills */}
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

          {/* Row 3: Category / Priority / Website — chip when active, select when not */}
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

            {/* Chip for statuses set outside the 4 quick pills */}
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
