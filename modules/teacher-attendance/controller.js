const pool = require('../../config/db');

// Get all attendance (admin/superadmin) or filtered by teacher_id
exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;

    let query = `
      SELECT ta.*, u.full_name AS teacher_name
      FROM teacher_attendance ta
      INNER JOIN users u ON u.id = ta.teacher_id
      WHERE 1=1
    `;
    const params = [];

    if (role_name === 'Teacher') {
      query += ' AND ta.teacher_id = ?';
      params.push(user_id);
    }

    // Optional date filter (future)
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get one attendance record
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, user_id } = req.user;

    let query = `
      SELECT ta.*, u.full_name AS teacher_name
      FROM teacher_attendance ta
      INNER JOIN users u ON u.id = ta.teacher_id
      WHERE ta.id = ?
    `;
    const params = [id];

    if (role_name === 'Teacher') {
      query += ' AND ta.teacher_id = ?';
      params.push(user_id);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create attendance
exports.create = async (req, res) => {
  try {
    const { teacher_id, attendance_date, status, check_in_time, check_out_time } = req.body;

    // Check for duplicate
    const [existing] = await pool.query(
      `SELECT id FROM teacher_attendance WHERE teacher_id = ? AND attendance_date = ?`,
      [teacher_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this date' });
    }

    const [result] = await pool.query(
      `INSERT INTO teacher_attendance (teacher_id, attendance_date, status, check_in_time, check_out_time)
       VALUES (?, ?, ?, ?, ?)`,
      [teacher_id, attendance_date, status, check_in_time, check_out_time]
    );
    res.json({ success: true, attendance_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time } = req.body;
    await pool.query(
      `UPDATE teacher_attendance SET status=?, check_in_time=?, check_out_time=? WHERE id=?`,
      [status, check_in_time, check_out_time, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (soft? we'll hard delete or restrict)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM teacher_attendance WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};