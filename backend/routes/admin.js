import express from 'express';
import jwt from 'jsonwebtoken';
import pkg from 'pg';

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

function adminMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Нет токена' });
  const token = auth.split(' ')[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'alpha') return res.status(403).json({ message: 'Нет доступа' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Неверный токен' });
  }
}

// Получить всех пользователей
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, client_key FROM users ORDER BY id');
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Сменить роль пользователя
router.post('/set-role', adminMiddleware, async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ message: 'userId и role обязательны' });
  if (!['user', 'beta', 'alpha'].includes(role)) return res.status(400).json({ message: 'Недопустимая роль' });
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    res.json({ message: 'Роль обновлена' });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router; 