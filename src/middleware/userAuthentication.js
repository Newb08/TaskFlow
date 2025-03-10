import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

const getUser = (req) => {
  const authHeader = req.headers.authorization;
  // console.log("Headers", authHeader)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      console.error('Invalid token', error.message);
      return null;
    }
  }
  return null;
};

export default getUser