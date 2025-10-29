import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
    query: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('connected', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('disconnected', reason);
  });

  return socket;
}

export function getSocket() { return socket; }
