// controllers/categoryController.js
const db     = require('../config/db');
const slugify = require('slugify');

exports.getCategories = async (_req, res, next) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image_url } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const [r] = await db.query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
      [name, slug, description, image_url]
    );
    res.status(201).json({ id: r.insertId, slug });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, image_url } = req.body;
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;
    await db.query(
      `UPDATE categories SET
        name        = COALESCE(?, name),
        slug        = COALESCE(?, slug),
        description = COALESCE(?, description),
        image_url   = COALESCE(?, image_url)
       WHERE id = ?`,
      [name, slug, description, image_url, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
};