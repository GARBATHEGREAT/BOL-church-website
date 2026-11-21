import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import './admin.css';
import AdminDashboard from './dashboard';
import AdminLogin from './login-form';

function App() {
  const [state, setState] = useState<{ loading: boolean; email: string | null }>({ loading: true, email: null });
  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.json())
      .then(d => setState({ loading: false, email: d.email || null }))
      .catch(() => setState({ loading: false, email: null }));
  }, []);
  if (state.loading) return <p style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</p>;
  return state.email ? <AdminDashboard email={state.email} /> : <AdminLogin />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
