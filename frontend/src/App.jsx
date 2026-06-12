import { useState, useEffect, useRef } from 'react';
import Login from './pages/Login';
import Table from './components/Table';
import Kanban from './components/Kanban';
import Stats from './components/Stats';
import { getLeads, updateLead, exportBackup, addCallLog, getCallLogs, getReengagementLeads, getFollowUpLeads, getStats, addLead, deleteLead } from './api';

const CATEGORIES = ['schools', 'Real Estate', 'interior designs', 'law', 'CA'];
const MEMBERS = ['', 'Ravi', 'Priya', 'Suresh'];
const STATUSES = ['', 'Not Called', 'Called - No Answer', 'Interested', 'Not Interested', 'Follow Up', 'Converted', 'Closed Deal'];
const PRIORITIES = ['high', 'medium', 'low'];
const STATUS_QUICK = ['Not Called', 'Interested', 'Follow Up', 'Converted'];
const EMPTY_FILTERS = { search: '', category: '', assigned_to: '', status: '', priority: '', website: '' };
const VALID_LOST_REASONS = ['Already has website', 'Too expensive', 'Not decision maker', 'Bad timing', 'No interest in digital', 'Other'];

const CATEGORY_COLORS = {
  'schools': '#3b82f6',
  'Real Estate': '#22c55e',
  'interior designs': '#a855f7',
  'law': '#f59e0b',
  'CA': '#ef4444',
};

const STATUS_COLORS = {
  'Not Called':         '#94a3b8',
  'Called - No Answer': '#94a3b8',
  'Interested':         '#22c55e',
  'Not Interested':     '#f87171',
  'Follow Up':          '#3b82f6',
  'Converted':          '#a855f7',
  'Closed Deal':        '#f59e0b',
};

const SCRIPTS = {
  'schools': "Hi, am I speaking with the principal or the person who handles admissions?\n\nHi [name], I'm calling from our agency in Vijayawada. We build websites for schools — I noticed your school doesn't have one online yet. I have 2 minutes — can I quickly show you what we did for a school similar to yours?",
  'Real Estate': "Hi, is this [business name]?\n\nHi, I'm calling from our agency. We build websites for real estate businesses in Vijayawada that help you get property enquiries directly from Google. Do you currently have a website that's bringing you leads?",
  'interior designs': "Hi, am I speaking with the owner?\n\nHi, I'm calling from our agency. We design websites for interior designers — mostly to show your portfolio and get client enquiries online. Are you currently getting clients from your website or mostly through referrals?",
  'CA': "Hi, is this [firm name]?\n\nHi, I'm calling from our agency in Vijayawada. We build professional websites for CA firms that help clients find you on Google. Most CA firms we speak to are getting zero online enquiries — is that the case for you too?",
  'law': "Hi, am I speaking with the advocate or the office manager?\n\nHi, I'm from our agency. We build websites for law firms in Vijayawada. A good website helps clients find you when they search for lawyers locally on Google. Do you currently have one?",
};

const PITCH_NOTES = {
  'schools': "Ask about admissions season. Mention mobile-first design. Reference how parents search for schools on Google. Highlight low maintenance — they don't need to manage it.",
  'Real Estate': "Ask if they get enquiries online currently. Mention Google Maps integration. Highlight property listing pages. Reference competitors who have sites.",
  'interior designs': "Focus on portfolio showcase. Mention Instagram-style gallery pages. Ask if clients find them online or only via referrals. Highlight before/after project pages.",
  'CA': "Mention GST filing season — clients search for CAs online. Highlight credibility and trust that a website builds. Reference how competitors show up on Google.",
  'law': "Ask what type of cases they handle. Mention local SEO — people search 'lawyer in Vijayawada'. Highlight consultation booking page. Keep pitch short — lawyers are busy.",
};

const OBJECTION_HANDLERS = {
  'Already has website': "Great! What does the site do for you currently — is it bringing in enquiries? Most sites we see are outdated or not optimized for Google. We can review it for free and show exactly what's holding it back.",
  'Too expensive': "Totally fair. Most businesses spend ₹20,000–40,000 once and get leads for years. Would you be open to seeing an ROI breakdown for your category? Even 1 client pays it off.",
  'Not decision maker': "No problem at all. Who would be the right person — the owner or MD? Can I call back when they're available, or would you prefer I WhatsApp the details?",
  'Bad timing': "Understood. When would be a better time — next week, or after a specific event? I'll set a reminder and call back then. Would WhatsApp work in the meantime?",
  'No interest in digital': "That's okay. Many businesses felt the same until they saw a competitor rank on page 1 of Google and start taking their clients. Would a 5-minute free audit change your mind?",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const s = {
  app: { minHeight: '100vh', background: '#080c14', color: '#f1f5f9' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '1px solid #1e293b', background: '#111827' },
  logo: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  user: { fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#64748b' },
  logoutBtn: { background: 'none', border: '1px solid #1e293b', color: '#64748b', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, marginLeft: 12 },
  backupBtn: { background: 'none', border: '1px solid #1e293b', color: '#3b82f6', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, marginLeft: 12 },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', background: '#111827', overflowX: 'auto' },
  tab: (active) => ({ padding: '12px 20px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', color: active ? '#3b82f6' : '#64748b', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', whiteSpace: 'nowrap' }),
  tabBadge: (color) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, background: color, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, padding: '0 5px' }),
  filterBar: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 24px', borderBottom: '1px solid #1e293b', background: '#0d1117' },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { background: '#111827', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 20, padding: '6px 14px', fontFamily: 'Inter, sans-serif', fontSize: 13, width: 220, outline: 'none' },
  quickPill: (active) => ({ background: active ? '#3b82f6' : '#111827', color: active ? '#fff' : '#64748b', border: `1px solid ${active ? '#3b82f6' : '#1e293b'}`, borderRadius: 20, padding: '4px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, whiteSpace: 'nowrap' }),
  filterSelect: { background: '#111827', border: '1px solid #1e293b', color: '#64748b', borderRadius: 20, padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 12 },
  chipRemove: { background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 },
  clearAll: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, textDecoration: 'underline', padding: 0 },
  label: { display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', marginBottom: 5 },
  mInput: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: 13, boxSizing: 'border-box' },
  mSelect: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: 13 },
  textarea: { width: '100%', background: '#080c14', border: '1px solid #1e293b', color: '#f1f5f9', borderRadius: 8, padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: 'none', color: '#64748b', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 22px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, cursor: 'pointer' },
  quickLogRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  quickBtn: (color) => ({ background: color + '18', color, border: `1px solid ${color}33`, borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, whiteSpace: 'nowrap' }),
  quickLogLabel: { fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#475569', marginBottom: 6 },
  collapsePanel: { border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden', background: '#0a0f1a' },
  collapseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', cursor: 'pointer', userSelect: 'none' },
  collapseTitle: { fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' },
  collapseChevron: (open) => ({ color: '#475569', fontSize: 10, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }),
  collapseBody: { padding: '0 14px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94a3b8', lineHeight: 1.75, whiteSpace: 'pre-wrap' },
  // Call timer
  timerBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, marginBottom: 12 },
  timerDot: (active) => ({ width: 8, height: 8, borderRadius: '50%', background: active ? '#22c55e' : '#334155', boxShadow: active ? '0 0 0 3px rgba(34,197,94,0.25)' : 'none' }),
  timerText: { fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#22c55e', flex: 1 },
  timerBtn: (active) => ({ background: active ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)', color: active ? '#f87171' : '#22c55e', border: `1px solid ${active ? 'rgba(248,113,113,0.2)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11 }),
  // Toast
  toast: { position: 'fixed', bottom: 24, right: 24, background: '#1e293b', color: '#f1f5f9', borderRadius: 8, padding: '12px 18px', fontFamily: 'Inter, sans-serif', fontSize: 13, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #334155', maxWidth: 340 },
};

// Toast notification
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const color = type === 'error' ? '#f87171' : type === 'warn' ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ ...s.toast, borderLeft: `3px solid ${color}` }}>
      <span style={{ color }}>{type === 'error' ? '✕' : type === 'warn' ? '⚠' : '✓'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', marginLeft: 'auto', padding: 0, fontSize: 14 }}>✕</button>
    </div>
  );
}

// Call duration timer hook
function useCallTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  function start() {
    setSeconds(0);
    setRunning(true);
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }
  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
    return seconds;
  }
  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(0);
  }
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { running, seconds, fmt: fmt(seconds), start, stop, reset };
}

function CollapsePanel({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={s.collapsePanel}>
      <div style={s.collapseHeader} onClick={() => setOpen(o => !o)}>
        <span style={s.collapseTitle}>{title}</span>
        <span style={s.collapseChevron(open)}>▶</span>
      </div>
      {open && <div style={s.collapseBody}>{children}</div>}
    </div>
  );
}

const PRIORITY_BORDER = { high: '#f87171', medium: '#fbbf24', low: '#334155' };

function BottomNav({ tab, setTab, followUpCount }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMore = tab === 'Kanban' || tab === 'Re-engage';

  const items = [
    {
      name: 'Leads', activeTabs: ['Leads'],
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    },
    {
      name: 'Follow Up', activeTabs: ['Follow Up'], badge: followUpCount || null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      name: 'Stats', activeTabs: ['Stats'],
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    },
    {
      name: 'More', activeTabs: ['Kanban', 'Re-engage'],
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>,
    },
  ];

  return (
    <>
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, background: '#111827', borderTop: '1px solid #1e293b', zIndex: 200 }}>
            {['Kanban', 'Re-engage'].map(name => (
              <button key={name}
                style={{ display: 'block', width: '100%', background: tab === name ? 'rgba(59,130,246,0.08)' : 'none', border: 'none', borderBottom: '1px solid #1e293b', color: tab === name ? '#3b82f6' : '#94a3b8', padding: '15px 24px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: 'pointer' }}
                onClick={() => { setTab(name); setMoreOpen(false); }}>
                {name}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, background: '#111827', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'stretch', zIndex: 200 }}>
        {items.map(item => {
          const active = item.activeTabs.includes(tab) || (item.name === 'More' && isMore);
          return (
            <button key={item.name}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#3b82f6' : '#475569', gap: 3, position: 'relative', padding: 0 }}
              onClick={() => item.name === 'More' ? setMoreOpen(o => !o) : (setTab(item.activeTabs[0]), setMoreOpen(false))}>
              <div style={{ position: 'relative' }}>
                {item.icon}
                {item.badge > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, background: '#f87171', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function LeadCards({ leads, onSelectLead }) {
  if (!leads.length) return (
    <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#334155' }}>No leads found</div>
  );
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {leads.map(lead => {
        const priColor = PRIORITY_BORDER[lead.priority] || '#334155';
        const catColor = CATEGORY_COLORS[lead.category] || '#64748b';
        const statusColor = STATUS_COLORS[lead.status] || '#94a3b8';
        return (
          <div key={lead.id} style={{ background: '#111827', borderLeft: `3px solid ${priColor}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => onSelectLead(lead)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: 14, flex: 1, marginRight: 8 }}>{lead.name}</div>
                <span style={{ background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}33`, borderRadius: 20, padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: 11, whiteSpace: 'nowrap' }}>{lead.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: catColor }}>{lead.category}</span>
                {lead.assigned_to && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#475569' }}>{lead.assigned_to}</span>}
              </div>
            </div>
            {lead.phone && (
              <a href={`tel:${lead.phone}`}
                onClick={e => e.stopPropagation()}
                style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.97-.97a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewLeadModal({ onClose, onSave, onToast }) {
  const [form, setForm] = useState({ name: '', phone: '', category: '', address: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    if (!form.name.trim()) { onToast('Name is required', 'error'); return; }
    if (!form.category) { onToast('Category is required', 'error'); return; }
    setSaving(true);
    try {
      const lead = await addLead({ ...form, name: form.name.trim() });
      onSave(lead);
      onToast('Lead added', 'success');
      onClose();
    } catch (e) {
      onToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, opacity: visible ? 1 : 0, transition: 'opacity 0.15s' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#0d1117', borderLeft: '1px solid #1e293b', zIndex: 101, display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(40px)', opacity: visible ? 1 : 0, transition: 'all 0.2s ease', padding: '24px 20px 32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>New Lead</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={s.label}>NAME *</label>
            <input style={s.mInput} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Business name" autoFocus />
          </div>
          <div>
            <label style={s.label}>CATEGORY *</label>
            <select style={s.mSelect} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>PHONE</label>
            <input style={s.mInput} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" />
          </div>
          <div>
            <label style={s.label}>ADDRESS</label>
            <input style={s.mInput} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Area, City" />
          </div>
          <div>
            <label style={s.label}>WEBSITE</label>
            <input style={s.mInput} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" type="url" />
          </div>
        </div>
        <div style={{ ...s.btnRow, marginTop: 24 }}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Lead'}
          </button>
        </div>
      </div>
    </>
  );
}

function LeadModal({ lead, onClose, onSave, onRemove, onToast, isMobile }) {
  const [form, setForm] = useState({
    status: lead.status,
    priority: lead.priority,
    assigned_to: lead.assigned_to || '',
    notes: lead.notes || '',
    follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [lostReasonPending, setLostReasonPending] = useState(false);
  const [pendingLostReason, setPendingLostReason] = useState('');
  const timer = useCallTimer();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    getCallLogs(lead.id)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, [lead.id]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function daysFromToday(n) {
    return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  }

  async function saveAndLog(data, logEntry) {
    setSaving(true);
    try {
      await onSave(lead.id, data);
      if (logEntry) {
        const newLog = await addCallLog(lead.id, logEntry).catch(() => null);
        if (newLog) setLogs(ls => [newLog, ...ls]);
      }
      onToast('Lead updated', 'success');
      onClose();
    } catch (e) {
      onToast('Failed to save', 'error');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function save(overrides = {}) {
    const finalData = { ...form, ...overrides };
    const durSec = timer.running ? timer.stop() : null;
    const logEntry = (finalData.status !== lead.status || finalData.notes !== (lead.notes || ''))
      ? { status_set: finalData.status, notes: finalData.notes, duration_seconds: durSec }
      : null;
    timer.reset();
    return saveAndLog(finalData, logEntry);
  }

  async function quickLog(status, follow_up_date = null) {
    const durSec = timer.running ? timer.stop() : null;
    timer.reset();
    const data = { status, ...(follow_up_date ? { follow_up_date } : {}) };
    setSaving(true);
    try {
      await onSave(lead.id, data);
      const newLog = await addCallLog(lead.id, { status_set: status, notes: form.notes, duration_seconds: durSec }).catch(() => null);
      if (newLog) setLogs(ls => [newLog, ...ls]);
      onToast(`Marked as ${status}`, 'success');
      onClose();
    } catch (e) {
      onToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    try {
      await deleteLead(lead.id);
      onToast('Lead archived', 'warn');
      onRemove(lead.id);
      onClose();
    } catch {
      onToast('Failed to archive', 'error');
    }
  }

  const catColor = CATEGORY_COLORS[lead.category] || '#64748b';
  const statusColor = STATUS_COLORS[lead.status] || '#64748b';

  const objectionData = lead.lost_reason && OBJECTION_HANDLERS[lead.lost_reason];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, opacity: visible ? 1 : 0, transition: 'opacity 0.15s' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '100vw', background: '#0d1117', borderLeft: '1px solid #1e293b', zIndex: 101, display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(40px)', opacity: visible ? 1 : 0, transition: 'all 0.2s ease', overflowY: 'auto', padding: '20px 20px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{lead.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: catColor + '1a', color: catColor, border: `1px solid ${catColor}33`, borderRadius: 20, padding: '2px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>{lead.category}</span>
              <span style={{ background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}33`, borderRadius: 20, padding: '2px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>{lead.status}</span>
              {lead.address && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#475569' }}>📍 {lead.address}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleArchive} style={{ background: 'none', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>Archive</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Phone + Call action */}
        {lead.phone && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '8px 14px', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, flex: 1 }} onClick={() => !timer.running && timer.start()}>
              📞 {lead.phone}
            </a>
            <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
              WhatsApp
            </a>
          </div>
        )}

        {/* Call Timer */}
        <div style={s.timerBar}>
          <div style={s.timerDot(timer.running)} />
          <span style={s.timerText}>{timer.running ? `On call — ${timer.fmt}` : timer.seconds > 0 ? `Last call: ${timer.fmt}` : 'Start timer when call begins'}</span>
          {!timer.running
            ? <button style={s.timerBtn(false)} onClick={timer.start}>Start</button>
            : <button style={s.timerBtn(true)} onClick={timer.stop}>Stop</button>
          }
        </div>

        {/* Quick log buttons */}
        <div style={{ marginBottom: 14 }}>
          <div style={s.quickLogLabel}>QUICK LOG</div>
          <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } : s.quickLogRow}>
            <button style={{ ...s.quickBtn('#94a3b8'), ...(isMobile && { minHeight: 44 }) }} onClick={() => quickLog('Called - No Answer')}>No Answer</button>
            <button style={{ ...s.quickBtn('#22c55e'), ...(isMobile && { minHeight: 44 }) }} onClick={() => quickLog('Interested')}>Interested ✓</button>
            <button style={{ ...s.quickBtn('#f87171'), ...(isMobile && { minHeight: 44 }) }} onClick={() => { setLostReasonPending(true); set('status', 'Not Interested'); }}>Not Interested</button>
            <button style={{ ...s.quickBtn('#3b82f6'), ...(isMobile && { minHeight: 44 }) }} onClick={() => { set('status', 'Follow Up'); set('follow_up_date', daysFromToday(3)); }}>Follow Up (+3d)</button>
            <button style={{ ...s.quickBtn('#f59e0b'), ...(isMobile && { minHeight: 44, gridColumn: 'span 2' }) }} onClick={() => quickLog('Converted')}>Converted 🎉</button>
          </div>
        </div>

        {/* Lost Reason (shown when Not Interested clicked) */}
        {lostReasonPending && (
          <div style={{ marginBottom: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: 14 }}>
            <label style={s.label}>WHY NOT INTERESTED?</label>
            <select style={s.mSelect} value={pendingLostReason} onChange={e => setPendingLostReason(e.target.value)}>
              <option value="">Select reason…</option>
              {VALID_LOST_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={{ ...s.saveBtn, background: '#f87171', fontSize: 12, padding: '6px 14px' }} onClick={() => {
                quickLog('Not Interested');
                setLostReasonPending(false);
                if (pendingLostReason) onSave(lead.id, { lost_reason: pendingLostReason });
              }}>Confirm</button>
              <button style={{ ...s.cancelBtn, fontSize: 12, padding: '6px 14px' }} onClick={() => setLostReasonPending(false)}>Cancel</button>
            </div>
            {/* Objection handler */}
            {pendingLostReason && OBJECTION_HANDLERS[pendingLostReason] && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#f59e0b', marginBottom: 5, fontWeight: 600 }}>OBJECTION HANDLER</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>{OBJECTION_HANDLERS[pendingLostReason]}</div>
              </div>
            )}
          </div>
        )}

        {/* Sales scripts & pitch notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <CollapsePanel title="📋 CALL SCRIPT">
            {SCRIPTS[lead.category] || 'No script for this category.'}
          </CollapsePanel>
          <CollapsePanel title="💡 PITCH NOTES">
            {PITCH_NOTES[lead.category] || 'No pitch notes for this category.'}
          </CollapsePanel>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', marginBottom: 14 }} />

        {/* Edit fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={s.label}>STATUS</label>
              <select style={s.mSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.filter(Boolean).map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>PRIORITY</label>
              <select style={s.mSelect} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={s.label}>ASSIGNED TO</label>
              <select style={s.mSelect} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                {MEMBERS.filter(Boolean).map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>FOLLOW-UP DATE</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[1, 3, 7].map(d => (
                  <button key={d} onClick={() => set('follow_up_date', daysFromToday(d))}
                    style={{ background: form.follow_up_date === daysFromToday(d) ? 'rgba(59,130,246,0.2)' : '#111827', color: form.follow_up_date === daysFromToday(d) ? '#3b82f6' : '#64748b', border: `1px solid ${form.follow_up_date === daysFromToday(d) ? '#3b82f6' : '#1e293b'}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                    +{d}d
                  </button>
                ))}
                <input type="date" style={{ ...s.mInput, flex: 1, minWidth: 100 }} value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label style={s.label}>NOTES</label>
            <textarea style={{ ...s.textarea, minHeight: 80 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Call notes, objections, what they said…" />
          </div>
        </div>

        <div style={s.btnRow}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={() => save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', margin: '18px 0 12px' }} />

        {/* Call History */}
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 12 }}>CALL HISTORY</div>
        {logsLoading ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#475569' }}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#334155' }}>No calls logged yet.</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 22 }}>
            <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 1, background: '#1e293b' }} />
            {logs.map(log => {
              const dotColor = STATUS_COLORS[log.status_set] || '#334155';
              return (
                <div key={log.id} style={{ position: 'relative', marginBottom: 14 }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 8, height: 8, borderRadius: '50%', background: dotColor, border: '2px solid #111827', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#475569' }}>{timeAgo(log.created_at)}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#334155' }}>·</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#64748b' }}>{log.logged_by}</span>
                    {log.duration_seconds > 0 && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#3b82f6' }}>
                        {Math.floor(log.duration_seconds / 60)}:{String(log.duration_seconds % 60).padStart(2, '0')}
                      </span>
                    )}
                    {log.status_set && (
                      <span style={{ background: dotColor + '1a', color: dotColor, border: `1px solid ${dotColor}33`, borderRadius: 10, padding: '1px 8px', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                        {log.status_set}
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{log.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [tab, setTab] = useState(() => window.innerWidth < 768 ? 'Leads' : 'Table');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reengagementLeads, setReengagementLeads] = useState([]);
  const [reengageLoading, setReengageLoading] = useState(false);
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  function showToast(message, type = 'success') {
    setToast({ message, type, key: Date.now() });
  }

  useEffect(() => {
    if (!user) return;
    // Load follow-up count for badge
    getStats().then(data => {
      setFollowUpCount(data.followUpsDue || 0);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page };
    getLeads(params)
      .then(data => {
        setLeads(data.leads ?? data);
        setTotalLeads(data.total ?? (data.leads ?? data).length);
        setTotalPages(data.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, filters, page]);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); setPage(1); }

  useEffect(() => {
    if (tab !== 'Re-engage') return;
    setReengageLoading(true);
    getReengagementLeads().then(setReengagementLeads).catch(console.error).finally(() => setReengageLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'Follow Up') return;
    setFollowUpLoading(true);
    getFollowUpLeads().then(data => {
      setFollowUpLeads(data);
      setFollowUpCount(data.length);
    }).catch(console.error).finally(() => setFollowUpLoading(false));
  }, [tab]);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setTab(t => t === 'Table' ? 'Leads' : t);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);


  async function handleResetAndCall(id) {
    await updateLead(id, { status: 'Not Called', lost_reason: null, follow_up_date: null });
    setReengagementLeads(ls => ls.filter(l => l.id !== id));
    showToast('Lead reset to Not Called');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  function handleLeadUpdate(updated) {
    setLeads(ls => ls.map(l => l.id === updated.id ? updated : l));
    // Update follow-up count if status changed
    if (updated.status !== 'Follow Up') {
      setFollowUpLeads(ls => ls.filter(l => l.id !== updated.id));
    }
  }

  async function handleSave(id, data) {
    const updated = await updateLead(id, data);
    handleLeadUpdate(updated);
    return updated;
  }

  function handleNewLead(lead) {
    setLeads(ls => [lead, ...ls]);
  }

  function handleLeadRemove(id) {
    setLeads(ls => ls.filter(l => l.id !== id));
    setFollowUpLeads(ls => ls.filter(l => l.id !== id));
    setReengagementLeads(ls => ls.filter(l => l.id !== id));
  }

  if (!user) return <Login onLogin={u => setUser(u)} />;

  const TABS = [
    isMobile ? { name: 'Leads' } : { name: 'Table' },
    { name: 'Follow Up', badge: followUpCount > 0 ? followUpCount : null, badgeColor: '#f87171' },
    { name: 'Kanban' },
    { name: 'Stats' },
    { name: 'Re-engage' },
  ];

  return (
    <div style={{ ...s.app, paddingBottom: isMobile ? 64 : 0 }}>
      <div style={s.header}>
        <div style={s.logo}>Agency CRM</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={s.user}>{user.name}</span>
          <button style={s.backupBtn} onClick={() => exportBackup().catch(console.error)}>↓ Backup</button>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {!isMobile && (
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.name} style={s.tab(tab === t.name)} onClick={() => setTab(t.name)}>
              {t.name}
              {t.badge ? <span style={s.tabBadge(t.badgeColor)}>{t.badge > 99 ? '99+' : t.badge}</span> : null}
            </button>
          ))}
        </div>
      )}

      {!isMobile && tab !== 'Stats' && tab !== 'Re-engage' && tab !== 'Follow Up' && (
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
            <button style={{ marginLeft: 'auto', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setNewLeadOpen(true)}>+ New Lead</button>
          </div>
          <div style={s.filterRow}>
            {STATUS_QUICK.map(st => (
              <button key={st} style={s.quickPill(filters.status === st)} onClick={() => setFilter('status', filters.status === st ? '' : st)}>
                {st}
              </button>
            ))}
          </div>
          <div style={s.filterRow}>
            {filters.category ? (
              <span style={s.chip}>Category: {filters.category}<button style={s.chipRemove} onClick={() => setFilter('category', '')}>✕</button></span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('category', e.target.value)}>
                <option value="">Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {filters.assigned_to ? (
              <span style={s.chip}>Agent: {filters.assigned_to}<button style={s.chipRemove} onClick={() => setFilter('assigned_to', '')}>✕</button></span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('assigned_to', e.target.value)}>
                <option value="">Agent</option>
                {MEMBERS.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {filters.priority ? (
              <span style={s.chip}>Priority: {filters.priority}<button style={s.chipRemove} onClick={() => setFilter('priority', '')}>✕</button></span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('priority', e.target.value)}>
                <option value="">Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {filters.website ? (
              <span style={s.chip}>{filters.website === 'has' ? 'Has Website' : 'No Website'}<button style={s.chipRemove} onClick={() => setFilter('website', '')}>✕</button></span>
            ) : (
              <select style={s.filterSelect} value="" onChange={e => e.target.value && setFilter('website', e.target.value)}>
                <option value="">Website</option>
                <option value="has">Has Website</option>
                <option value="none">No Website</option>
              </select>
            )}
          </div>
        </div>
      )}

      {isMobile && tab !== 'Stats' && tab !== 'Re-engage' && tab !== 'Follow Up' && (
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 12px', flex: 1, scrollbarWidth: 'none' }}>
            {[
              { label: 'Interested', key: 'status',   value: 'Interested', color: '#22c55e' },
              { label: 'Follow Up',  key: 'status',   value: 'Follow Up',  color: '#3b82f6' },
              { label: 'High',       key: 'priority', value: 'high',       color: '#f87171' },
            ].map(f => {
              const active = filters[f.key] === f.value;
              return (
                <button key={f.label} onClick={() => setFilter(f.key, active ? '' : f.value)}
                  style={{ flexShrink: 0, background: active ? f.color + '22' : '#111827', color: active ? f.color : '#64748b', border: `1px solid ${active ? f.color + '55' : '#1e293b'}`, borderRadius: 20, padding: '5px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button onClick={() => setFilters(EMPTY_FILTERS)}
                style={{ flexShrink: 0, background: 'none', color: '#475569', border: '1px solid #1e293b', borderRadius: 20, padding: '5px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer' }}>
                ✕ Clear
              </button>
            )}
          </div>
          <button onClick={() => setShowFilterDrawer(true)}
            style={{ flexShrink: 0, background: hasActiveFilters ? 'rgba(59,130,246,0.12)' : 'none', border: 'none', borderLeft: '1px solid #1e293b', color: hasActiveFilters ? '#3b82f6' : '#475569', padding: '0 14px', height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {loading && <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', color: '#64748b' }}>Loading…</div>}
      {!loading && tab === 'Leads' && <LeadCards leads={leads} onSelectLead={setSelectedLead} />}
      {!loading && tab === 'Table' && <Table leads={leads} onSelectLead={setSelectedLead} onLeadUpdate={handleLeadUpdate} page={page} pages={totalPages} total={totalLeads} onPageChange={setPage} />}
      {!loading && tab === 'Kanban' && <Kanban leads={leads} onSelectLead={setSelectedLead} />}
      {tab === 'Stats' && <Stats />}

      {/* Follow-up queue */}
      {tab === 'Follow Up' && (
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Follow-up Queue</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#475569', marginBottom: 18 }}>Leads with overdue or today's follow-up date</div>
          {followUpLoading ? (
            <div style={{ fontFamily: 'Inter, sans-serif', color: '#475569', fontSize: 13 }}>Loading…</div>
          ) : followUpLeads.length === 0 ? (
            <div style={{ fontFamily: 'Inter, sans-serif', color: '#334155', fontSize: 13 }}>No follow-ups due — you're all caught up! ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {followUpLeads.map(lead => {
                const isOverdue = new Date(lead.follow_up_date) < new Date(new Date().toDateString());
                return (
                  <div key={lead.id} style={{ background: '#111827', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : '#1e293b'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 4 }}>{lead.name}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>{lead.category}</span>
                        <span style={{ color: '#3b82f6' }}>{lead.assigned_to}</span>
                        {lead.phone && <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{lead.phone}</a>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: isOverdue ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)', color: isOverdue ? '#f87171' : '#f59e0b', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`, borderRadius: 6, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                        {isOverdue ? 'OVERDUE' : 'TODAY'} — {new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Re-engage queue */}
      {tab === 'Re-engage' && (
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Re-engagement Queue</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#475569', marginBottom: 18 }}>Leads marked Not Interested 60+ days ago</div>
          {reengageLoading ? (
            <div style={{ fontFamily: 'Inter, sans-serif', color: '#475569', fontSize: 13 }}>Loading…</div>
          ) : reengagementLeads.length === 0 ? (
            <div style={{ fontFamily: 'Inter, sans-serif', color: '#334155', fontSize: 13 }}>No leads in re-engagement queue</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reengagementLeads.map(lead => (
                <div key={lead.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 5 }}>{lead.name}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{lead.category}</span>
                      <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{lead.phone}</a>
                      {lead.lost_reason && <span style={{ color: '#f87171' }}>"{lead.lost_reason}"</span>}
                      {lead.last_called && <span>Last: {new Date(lead.last_called).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <button
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '7px 16px', fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={e => { e.stopPropagation(); handleResetAndCall(lead.id); }}
                  >
                    Reset & Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showFilterDrawer && (
        <>
          <div onClick={() => setShowFilterDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 299 }} />
          <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, background: '#0d1117', borderTop: '1px solid #1e293b', borderRadius: '16px 16px 0 0', zIndex: 300, padding: '0 0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Filters</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {hasActiveFilters && <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ background: 'none', border: 'none', color: '#475569', fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Clear all</button>}
                <button onClick={() => setShowFilterDrawer(false)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '0 12px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={{ ...s.searchInput, width: '100%', boxSizing: 'border-box' }} placeholder="Search name or phone…" value={filters.search} onChange={e => setFilter('search', e.target.value)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_QUICK.map(st => (
                  <button key={st} style={s.quickPill(filters.status === st)} onClick={() => setFilter('status', filters.status === st ? '' : st)}>{st}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select style={s.filterSelect} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                  <option value="">Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select style={s.filterSelect} value={filters.assigned_to} onChange={e => setFilter('assigned_to', e.target.value)}>
                  <option value="">Agent</option>
                  {MEMBERS.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select style={s.filterSelect} value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                  <option value="">Priority</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select style={s.filterSelect} value={filters.website} onChange={e => setFilter('website', e.target.value)}>
                  <option value="">Website</option>
                  <option value="has">Has Website</option>
                  <option value="none">No Website</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...s.saveBtn, flex: 1, textAlign: 'center' }} onClick={() => setShowFilterDrawer(false)}>Apply</button>
                <button style={{ ...s.saveBtn, background: '#1e293b', color: '#f1f5f9' }} onClick={() => { setNewLeadOpen(true); setShowFilterDrawer(false); }}>+ New Lead</button>
              </div>
            </div>
          </div>
        </>
      )}
      {newLeadOpen && <NewLeadModal onClose={() => setNewLeadOpen(false)} onSave={handleNewLead} onToast={showToast} />}
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={handleSave} onRemove={handleLeadRemove} onToast={showToast} isMobile={isMobile} />}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isMobile && <BottomNav tab={tab} setTab={setTab} followUpCount={followUpCount} />}
    </div>
  );
}
