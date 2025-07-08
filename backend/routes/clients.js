import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Нет токена' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Неверный токен' });
  }
}

// Скачать Beta
router.get('/beta', authMiddleware, (req, res) => {
  if (req.user.role === 'beta' || req.user.role === 'alpha') {
    res.sendFile(path.join(__dirname, '../clients/client-beta.zip'));
  } else {
    res.status(403).json({ message: 'Нет доступа к Beta' });
  }
});

// Скачать Alpha
router.get('/alpha', authMiddleware, (req, res) => {
  if (req.user.role === 'alpha') {
    res.sendFile(path.join(__dirname, '../clients/client-alpha.zip'));
  } else {
    res.status(403).json({ message: 'Нет доступа к Alpha' });
  }
});

export default router; 