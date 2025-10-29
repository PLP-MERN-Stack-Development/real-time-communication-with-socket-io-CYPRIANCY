import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth.js';
import { initSocket } from './socket.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));

// Routes
app.use('/api/auth', authRoutes);

// Basic health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' },
  pingTimeout: 60000
});

initSocket(io);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error', err);
});
