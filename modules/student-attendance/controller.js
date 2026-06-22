const pool = require('../../config/db');

// Get attendance – with data filtering based on role
exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT a.*, u.full_name as student_name
      FROM student_attendance a
      INNER JOIN users u ON u.id = a.student_id
      WHERE 1=1
    `;
    const params = [];
    if (role_name === 'Student') {
      query += ' AND a.student_id = ?';
      params.push(user_id);
    }
    // For Teacher, we might want to filter by their assigned classes (optional)
    // For now, teacher sees all (we can add class filter later)
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
    const [rows] = await pool.query(`
      SELECT a.*, u.full_name as student_name
      FROM student_attendance a
      INNER JOIN users u ON u.id = a.student_id
      WHERE a.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create attendance record
exports.create = async (req, res) => {
  try {
    const { student_id, attendance_date, status, class: cls, section, remarks } = req.body;
    // Optional: prevent duplicate for same student/date
    const [existing] = await pool.query(
      'SELECT id FROM student_attendance WHERE student_id = ? AND attendance_date = ?',
      [student_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this date' });
    }
    const [result] = await pool.query(`
      INSERT INTO student_attendance (student_id, attendance_date, status, class, section, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [student_id, attendance_date, status, cls, section, remarks]);
    res.json({ success: true, attendance_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance record
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    await pool.query(`
      UPDATE student_attendance SET status = ?, remarks = ? WHERE id = ?
    `, [status, remarks, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (soft delete not needed, but we can physically delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM student_attendance WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};