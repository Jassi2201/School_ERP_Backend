const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id, b.title, b.author, b.isbn, b.quantity, b.status,
             (b.quantity - COALESCE((
               SELECT COUNT(*) FROM book_issues bi
               WHERE bi.book_id = b.id AND bi.return_date IS NULL
             ), 0)) AS available
      FROM books b
      WHERE b.status = 'active'
      ORDER BY b.title
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT b.*,
             (b.quantity - COALESCE((
               SELECT COUNT(*) FROM book_issues bi
               WHERE bi.book_id = b.id AND bi.return_date IS NULL
             ), 0)) AS available
      FROM books b
      WHERE b.id = ? AND b.status = 'active'
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, author, isbn, quantity } = req.body;
    const [result] = await pool.query(
      `INSERT INTO books (title, author, isbn, quantity) VALUES (?, ?, ?, ?)`,
      [title, author, isbn, quantity]
    );
    res.json({ success: true, book_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'ISBN already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, quantity, status } = req.body;
    await pool.query(
      `UPDATE books SET title=?, author=?, isbn=?, quantity=?, status=? WHERE id=?`,
      [title, author, isbn, quantity, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE books SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};