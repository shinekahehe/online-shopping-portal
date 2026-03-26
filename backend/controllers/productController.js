// controllers/productController.js
const db     = require('../config/db');
const slugify = require('slugify');

// ── GET /api/products ─────────────────────────────────────────
// Supports: ?search=&category=&minPrice=&maxPrice=&page=&limit=
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ['p.is_active = 1'];

    if (search) {
      conditions.push('MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE)');
      params.push(`${search}*`);
    }
    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }
    if (minPrice) { conditions.push('p.price >= ?'); params.push(minPrice); }
    if (maxPrice) { conditions.push('p.price <= ?'); params.push(maxPrice); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.id, p.name, p.slug, p.price, p.stock, p.image_url,
             c.id AS category_id, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`;

    params.push(Number(limit), Number(offset));

    const [products] = await db.query(sql, params);

    // Get total count for pagination
    const countParams = params.slice(0, -2);
    const [countRes] = await db.query(
      `SELECT COUNT(*) AS total FROM products p JOIN categories c ON p.category_id = c.id ${where}`,
      countParams
    );

    res.json({
      products,
      pagination: {
        total: countRes[0].total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(countRes[0].total / limit),
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/products/:slug ────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) { next(err); }
};

// ── POST /api/products  (admin) ───────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const [result] = await db.query(
      `INSERT INTO products (name, slug, description, price, stock, category_id, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, stock, category_id, image_url]
    );
    res.status(201).json({ id: result.insertId, slug });
  } catch (err) { next(err); }
};

// ── PUT /api/products/:id  (admin) ────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, image_url, is_active } = req.body;
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

    await db.query(
      `UPDATE products SET
        name        = COALESCE(?, name),
        slug        = COALESCE(?, slug),
        description = COALESCE(?, description),
        price       = COALESCE(?, price),
        stock       = COALESCE(?, stock),
        category_id = COALESCE(?, category_id),
        image_url   = COALESCE(?, image_url),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, slug, description, price, stock, category_id, image_url, is_active, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) { next(err); }
};

// ── DELETE /api/products/:id  (admin – soft delete) ──────────
exports.deleteProduct = async (req, res, next) => {
  try {
    await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
};