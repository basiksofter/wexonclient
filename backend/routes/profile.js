import express from 'express';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: true
});

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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT username, role, client_key FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router; 