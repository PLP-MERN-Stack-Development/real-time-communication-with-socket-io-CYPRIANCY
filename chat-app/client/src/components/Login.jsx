import React, { useState } from 'react';
import { login } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(username.trim());
      const user = { ...data.user, token: data.token };
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-96">
      <h2 className="text-2xl font-semibold text-center mb-6 text-blue-600">Join the Chat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter a username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Joining...' : 'Enter Chat'}
        </button>
      </form>
    </div>
  );
}
