const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export async function login(username) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}
