import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Simple username-based "login". If user doesn't exist, create.
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    let user = await User.findOne({ username });
    if (!user) user = await User.create({ username });

    const payload = { userId: user._id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });

    return res.json({ token, user: { id: user._id, username: user.username, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
