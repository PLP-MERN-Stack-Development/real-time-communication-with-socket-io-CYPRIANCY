import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../socket';

function MessageCard({ msg, currentUser, onReact }) {
  const isOwn = msg.sender?._id === currentUser.id;
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`p-3 rounded-2xl max-w-xs ${
          isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {!isOwn && <div className="font-semibold mb-1 text-sm">{msg.sender?.username}</div>}
        <p>{msg.content}</p>
        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
          <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
          {msg.reactions?.length > 0 && (
            <span>❤️ {msg.reactions.length}</span>
          )}
        </div>
        <div className="mt-1 flex gap-1">
          <button onClick={() => onReact(msg._id, '👍')} className="text-xs hover:opacity-70">👍</button>
          <button onClick={() => onReact(msg._id, '❤️')} className="text-xs hover:opacity-70">❤️</button>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoom({ user, onLogout }) {
  const socket = getSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [online, setOnline] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const endRef = useRef();

  useEffect(() => {
    if (!socket) return;

    socket.on('messages:init', (msgs) => setMessages(msgs));
    socket.on('message:new', (msg) => setMessages((p) => [...p, msg]));
    socket.on('user:online', (u) => setOnline((p) => [...p, u]));
    socket.on('user:offline', (u) => setOnline((p) => p.filter((x) => x.userId !== u.userId)));
    socket.on('typing:update', ({ username, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [username]: isTyping }));
    });
    socket.on('message:reaction', ({ messageId, reaction, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, reactions: [...(m.reactions || []), { user: userId, reaction }] }
            : m
        )
      );
    });

    return () => socket.removeAllListeners();
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('send_message', { content: text, room: 'global' });
    setText('');
  };

  const handleTyping = (e) => {
    setText(e.target.value);
     if (!socket) return; // Prevent error if socket is null
    socket.emit("typing", { user });
    socket.emit('typing', { room: 'global', isTyping: true });
    setTimeout(() => socket.emit('typing', { room: 'global', isTyping: false }), 1000);
  };

  const handleReaction = (messageId, reaction) => {
    socket.emit('reaction', { messageId, reaction });
  };

  return (
    <div className="flex bg-white rounded-xl shadow-lg w-11/12 max-w-6xl h-[80vh] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-100 p-4 flex flex-col border-r">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-600">Online Users</h2>
          <button
            onClick={onLogout}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <ul className="space-y-2">
          {online.length ? (
            online.map((u) => (
              <li
                key={u.userId}
                className="bg-white shadow-sm p-2 rounded-md text-sm flex items-center justify-between"
              >
                <span>{u.username}</span>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No users online</p>
          )}
        </ul>
      </aside>

      {/* Chat Section */}
      <section className="flex flex-col flex-1">
        <header className="p-4 bg-blue-600 text-white font-semibold text-lg">
          Global Chat
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {messages.map((m) => (
            <MessageCard
              key={m._id}
              msg={m}
              currentUser={user}
              onReact={handleReaction}
            />
          ))}
          <div ref={endRef} />
        </div>
        <footer className="p-4 bg-gray-100 border-t flex items-center gap-2">
          <input
            value={text}
            onChange={handleTyping}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
        </footer>
        <div className="text-xs text-gray-500 px-4 py-1">
          {Object.values(typingUsers)
            .filter(Boolean)
            .map((u) => `${u} is typing...`)
            .join(', ')}
        </div>
      </section>
    </div>
  );
}
