import jwt from 'jsonwebtoken';
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
  } catch (err) {
    return null;
  }
}
