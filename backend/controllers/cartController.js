// controllers/cartController.js
const db = require('../config/db');

// ── GET /api/cart ─────────────────────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    const [items] = await db.query(
      `SELECT c.id, c.quantity,
              p.id AS product_id, p.name, p.slug, p.price, p.image_url, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    // Compute totals on server to avoid client-side tampering
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ items, total: parseFloat(total.toFixed(2)) });
  } catch (err) { next(err); }
};

// ── POST /api/cart ─────────────────────────────────────────────
exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // Verify product exists and has enough stock
    const [prod] = await db.query(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = 1',
      [product_id]
    );
    if (!prod.length)       return res.status(404).json({ message: 'Product not found' });
    if (prod[0].stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

    // Upsert: if already in cart, increase quantity
    await db.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ message: 'Added to cart' });
  } catch (err) { next(err); }
};

// ── PUT /api/cart/:id ─────────────────────────────────────────
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      // Remove item if quantity drops to 0
      await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      return res.json({ message: 'Item removed' });
    }
    await db.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.id]
    );
    res.json({ message: 'Cart updated' });
  } catch (err) { next(err); }
};

// ── DELETE /api/cart/:id ──────────────────────────────────────
exports.removeFromCart = async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) { next(err); }
};

// ── DELETE /api/cart  (clear entire cart) ─────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) { next(err); }
};