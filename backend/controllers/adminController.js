// controllers/adminController.js – Admin-only operations
const db = require('../config/db');

// ── GET /api/admin/dashboard ──────────────────────────────────
exports.getDashboard = async (_req, res, next) => {
  try {
    const [[{ totalUsers }]]    = await db.query('SELECT COUNT(*) AS totalUsers FROM users WHERE role = "customer"');
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = 1');
    const [[{ totalOrders }]]   = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ revenue }]]       = await db.query('SELECT COALESCE(SUM(total_amount),0) AS revenue FROM orders WHERE status != "cancelled"');

    const [recentOrders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, u.name AS customer
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    res.json({ totalUsers, totalProducts, totalOrders, revenue, recentOrders });
  } catch (err) { next(err); }
};

// ── GET /api/admin/orders ─────────────────────────────────────
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (status) { where = 'WHERE o.status = ?'; params.push(status); }

    const [orders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.payment_status, o.created_at,
              u.name AS customer, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ orders });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/orders/:id/status ───────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) { next(err); }
};

// ── GET /api/admin/users ──────────────────────────────────────
exports.getAllUsers = async (_req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) { next(err); }
};