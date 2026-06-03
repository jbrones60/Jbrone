const BASE = import.meta.env.VITE_API_URL;

function headers() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function getLeads(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  const res = await fetch(`${BASE}/api/v1/leads?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE}/api/v1/leads/stats`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function exportBackup() {
  const res = await fetch(`${BASE}/api/v1/leads/backup`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to export backup');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-backup-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function updateLead(id, data) {
  const res = await fetch(`${BASE}/api/v1/leads/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
}
