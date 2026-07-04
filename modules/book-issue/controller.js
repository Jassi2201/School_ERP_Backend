const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT bi.*,
             b.title AS book_title,
             u.full_name AS student_name
      FROM book_issues bi
      JOIN books b ON b.id = bi.book_id
      JOIN users u ON u.id = bi.student_id
      WHERE bi.status != 'returned'
      ORDER BY bi.due_date ASC
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
      SELECT bi.*,
             b.title AS book_title,
             u.full_name AS student_name
      FROM book_issues bi
      JOIN books b ON b.id = bi.book_id
      JOIN users u ON u.id = bi.student_id
      WHERE bi.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { book_id, student_id, issue_date, due_date } = req.body;

    // Check availability with row lock
    const [book] = await connection.query(
      `SELECT available FROM books WHERE id = ? FOR UPDATE`,
      [book_id]
    );
    if (!book.length) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book[0].available <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available' });
    }

    // Insert issue
    const [result] = await connection.query(
      `INSERT INTO book_issues (book_id, student_id, issue_date, due_date, status)
       VALUES (?, ?, ?, ?, 'issued')`,
      [book_id, student_id, issue_date, due_date]
    );

    // Decrement available
    await connection.query(
      `UPDATE books SET available = available - 1 WHERE id = ?`,
      [book_id]
    );

    await connection.commit();
    res.json({ success: true, issue_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete – mark as returned without return date (could be used for admin correction)
    await pool.query(`UPDATE book_issues SET status = 'returned' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};