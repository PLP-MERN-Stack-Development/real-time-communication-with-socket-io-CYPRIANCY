import { verifyToken } from './utils/authMiddleware.js';
import User from './models/User.js';
import Message from './models/Message.js';

/*
Socket events built:
- connection (authenticate with token)
- join_room { room }
- leave_room { room }
- send_message { content, room, type, toUserId? }
- typing { room, isTyping, toUserId? }
- read_messages { messageIds, room? }
- reaction { messageId, reaction }

Server emits:
- message:new
- user:online
- user:offline
- typing:update
- messages:read
- message:reaction
*/

const onlineUsers = new Map(); // userId -> socket.id (or set of socket ids)

export function initSocket(io) {
  io.on('connection', async (socket) => {
    // token expected in query: ?token=...
    const { token } = socket.handshake.query;
    const payload = verifyToken(token);
    if (!payload) {
      socket.emit('error', 'Authentication error');
      socket.disconnect(true);
      return;
    }

    // Attach user
    const user = await User.findById(payload.userId) || await User.create({ _id: payload.userId, username: payload.username });
    socket.user = user;

    // manage multi-socket per user
    const userSockets = onlineUsers.get(String(user._id)) || new Set();
    userSockets.add(socket.id);
    onlineUsers.set(String(user._id), userSockets);

    // Notify others
    io.emit('user:online', { userId: user._id.toString(), username: user.username });

    // Join default global room
    socket.join('global');

    // Load recent messages for global room and send to the connecting socket
    const recent = await Message.find({ room: 'global' }).sort({ createdAt: 1 }).limit(200).populate('sender', 'username');
    socket.emit('messages:init', recent);

    // handlers
    socket.on('join_room', async ({ room }) => {
      socket.join(room);
      const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).populate('sender', 'username');
      socket.emit('messages:init', messages);
      io.to(room).emit('system', { text: `${user.username} joined ${room}`, room });
    });

    socket.on('leave_room', ({ room }) => {
      socket.leave(room);
      io.to(room).emit('system', { text: `${user.username} left ${room}`, room });
    });

    socket.on('send_message', async (payload, cb) => {
      // payload: { content, room, type, toUserId }
      try {
        const { content, room = 'global', type = 'text' } = payload;
        // if private, set room to direct:lowerId:higherId for consistent key
        let finalRoom = room;
        if (payload.toUserId) {
          const otherId = payload.toUserId;
          const parts = [String(user._id), String(otherId)].sort();
          finalRoom = `direct:${parts[0]}:${parts[1]}`;
        }
        const msg = await Message.create({
          sender: user._id,
          content,
          room: finalRoom,
          type,
          readBy: [user._id]
        });
        const populated = await msg.populate('sender', 'username').execPopulate?.() ?? await Message.findById(msg._id).populate('sender', 'username');

        // emit to room
        io.to(finalRoom).emit('message:new', populated);

        // ack
        if (cb) cb({ status: 'ok', messageId: msg._id });
      } catch (err) {
        console.error(err);
        if (cb) cb({ status: 'error' });
      }
    });

    socket.on('typing', ({ room = 'global', isTyping, toUserId }) => {
      if (toUserId) {
        // private typing -> emit to other user's sockets
        const targetSockets = onlineUsers.get(String(toUserId)) || new Set();
        targetSockets.forEach(sid => io.to(sid).emit('typing:update', { userId: user._id, username: user.username, isTyping, private: true }));
      } else {
        socket.to(room).emit('typing:update', { userId: user._id, username: user.username, isTyping, room });
      }
    });

    socket.on('messages:read', async ({ messageIds, room }) => {
      try {
        await Message.updateMany({ _id: { $in: messageIds } }, { $addToSet: { readBy: user._id } });
        io.to(room || 'global').emit('messages:read', { messageIds, userId: user._id });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('reaction', async ({ messageId, reaction }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        msg.reactions.push({ user: user._id, reaction });
        await msg.save();
        const pop = await Message.findById(messageId).populate('sender', 'username');
        io.to(pop.room).emit('message:reaction', { messageId, reaction, userId: user._id });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', async () => {
      // remove socket id from map
      const s = onlineUsers.get(String(user._id));
      if (s) {
        s.delete(socket.id);
        if (s.size === 0) {
          onlineUsers.delete(String(user._id));
          io.emit('user:offline', { userId: user._id, username: user.username });
          await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
        } else {
          onlineUsers.set(String(user._id), s);
        }
      }
    });
  });
}
