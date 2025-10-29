import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
