const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT l.*,
             u.full_name AS student_name,
             a.full_name AS approved_by_name
      FROM student_leaves l
      JOIN users u ON u.id = l.student_id
      LEFT JOIN users a ON a.id = l.approved_by
      WHERE l.status = 'active'
    `;
    const params = [];
    if (role_name === 'Student') {
      query += ' AND l.student_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY l.applied_date DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT l.*,
             u.full_name AS student_name,
             a.full_name AS approved_by_name
      FROM student_leaves l
      JOIN users u ON u.id = l.student_id
      LEFT JOIN users a ON a.id = l.approved_by
      WHERE l.id = ? AND l.status = 'active'
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply leave (student)
exports.create = async (req, res) => {
  try {
    const { leave_type, from_date, to_date, reason } = req.body;
    const student_id = req.user.user_id;
    const [result] = await pool.query(
      `INSERT INTO student_leaves (student_id, leave_type, from_date, to_date, reason, leave_status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [student_id, leave_type, from_date, to_date, reason]
    );
    res.json({ success: true, leave_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update leave – approve/reject
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { leave_status, remarks } = req.body;
    const approved_by = req.user.user_id;
    const approved_date = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE student_leaves SET leave_status = ?, approved_by = ?, approved_date = ?, remarks = ? WHERE id = ?`,
      [leave_status, approved_by, approved_date, remarks, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete (admin only)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE student_leaves SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};