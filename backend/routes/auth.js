import express from 'express';
import bcrypt from 'bcrypt';
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

// Регистрация
router.post('/register', async (req, res) => {
  const { username, password, client_key } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Введите логин и пароль' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, client_key) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, client_key]
    );
    res.status(201).json({ message: 'Пользователь зарегистрирован', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ message: 'Пользователь уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Введите логин и пароль' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Неверный логин или пароль' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Неверный логин или пароль' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router; 