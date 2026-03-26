// controllers/orderController.js
const db = require('../config/db');

// ── POST /api/orders  (checkout) ──────────────────────────────
exports.createOrder = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { shipping_address, payment_method = 'cod' } = req.body;
    const userId = req.user.id;

    // 1. Fetch cart items
    const [cartItems] = await conn.query(
      `SELECT c.quantity, p.id AS product_id, p.price, p.stock, p.name
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );
    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2. Verify stock and compute total
    let total = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ message: `Insufficient stock for "${item.name}"` });
      }
      total += item.price * item.quantity;
    }

    // 3. Create order record
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method)
       VALUES (?, ?, ?, ?)`,
      [userId, total.toFixed(2), JSON.stringify(shipping_address), payment_method]
    );
    const orderId = orderResult.insertId;

    // 4. Insert order items & decrement stock
    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 5. Clear cart
    await conn.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    await conn.commit();
    res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// ── GET /api/orders  (my orders) ─────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, 
              JSON_ARRAYAGG(JSON_OBJECT(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'image_url', p.image_url
              )) AS items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) { next(err); }
};

// ── GET /api/orders/:id ───────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, oi.product_id, oi.quantity, oi.unit_price,
              p.name AS product_name, p.image_url
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });

    // Reshape into a single order with items array
    const order = { ...rows[0], items: rows.map(r => ({
      product_id: r.product_id, quantity: r.quantity,
      unit_price: r.unit_price, name: r.product_name, image_url: r.image_url,
    }))};
    res.json({ order });
  } catch (err) { next(err); }
};