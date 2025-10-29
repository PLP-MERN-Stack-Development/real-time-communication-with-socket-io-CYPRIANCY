import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String },
  room: { type: String, default: 'global' }, // global or room name or direct:<userId1>:<userId2>
  type: { type: String, default: 'text' }, // text | image | file | system
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reaction: String,
    createdAt: { type: Date, default: Date.now }
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
