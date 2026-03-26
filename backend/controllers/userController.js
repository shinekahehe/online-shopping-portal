// controllers/userController.js
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ── GET /api/users/profile ────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
};

// ── PUT /api/users/profile ────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar_url } = req.body;
    await db.query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
      [name, phone, avatar_url, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) { next(err); }
};

// ── PUT /api/users/password ───────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match  = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
};