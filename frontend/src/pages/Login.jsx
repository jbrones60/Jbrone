import { useState } from 'react';
import { login } from '../api';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14' },
  card: { background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 40, width: 360 },
  title: { fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 8 },
  sub: { color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: 13, marginBottom: 28 },
  label: { display: 'block', color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontSize: 12, marginBottom: 6 },
  input: { width: '100%', background: '#080c14', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 },
  btn: { width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  err: { color: '#f87171', fontFamily: 'Inter, sans-serif', fontSize: 13, marginBottom: 12 },
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Agency CRM</div>
        <div style={s.sub}>Vijayawada Lead Manager</div>
        <form onSubmit={handleSubmit}>
          {error && <div style={s.err}>{error}</div>}
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
