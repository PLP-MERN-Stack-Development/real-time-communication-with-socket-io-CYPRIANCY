import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { connectSocket, getSocket } from './socket';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (user?.token) {
      connectSocket(user.token);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <ChatRoom
          user={user}
          onLogout={() => {
            localStorage.removeItem('user');
            const s = getSocket();
            s?.disconnect();
            setUser(null);
          }}
        />
      )}
    </div>
  );
}
