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
      ORDER BY bi.updated_at DESC
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
    if (!rows.length) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.returnBook = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { return_date, fine_amount } = req.body;

    // Get book_id
    const [issue] = await connection.query(
      `SELECT book_id FROM book_issues WHERE id = ?`,
      [id]
    );
    if (!issue.length) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Update issue
    await connection.query(
      `UPDATE book_issues SET return_date = ?, fine_amount = ?, status = 'returned' WHERE id = ?`,
      [return_date, fine_amount || 0, id]
    );

    // Increment available
    await connection.query(
      `UPDATE books SET available = available + 1 WHERE id = ?`,
      [issue[0].book_id]
    );

    await connection.commit();
    res.json({ success: true });
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
    // Permanently delete record (admin only)
    await pool.query(`DELETE FROM book_issues WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== STUDENT BOOKS (Mobile) =====================
exports.getMyBooks = async (req, res) => {
  try {
    const student_id = req.user.user_id;

    const [rows] = await pool.query(
      `
      SELECT bi.*,
             b.title AS book_title,
             b.author,
             b.isbn,
           bi.status
      FROM book_issues bi
      JOIN books b ON b.id = bi.book_id
      WHERE bi.student_id = ?
      ORDER BY bi.return_date IS NULL DESC, bi.due_date ASC
      `,
      [student_id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};