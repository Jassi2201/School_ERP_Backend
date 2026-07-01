const pool = require('../../config/db');

// Get all attendance records
exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;

    let query = `
      SELECT sa.*,
             u.full_name AS student_name,
             c.name AS class,
             s.name AS section
      FROM student_attendance sa
      INNER JOIN users u ON u.id = sa.student_id
      LEFT JOIN student_details sd ON sd.user_id = sa.student_id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE 1=1
    `;
    const params = [];

    if (role_name === 'Student') {
      query += ' AND sa.student_id = ?';
      params.push(user_id);
    }

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
      SELECT sa.*,
             u.full_name AS student_name,
             c.name AS class,
             s.name AS section
      FROM student_attendance sa
      INNER JOIN users u ON u.id = sa.student_id
      LEFT JOIN student_details sd ON sd.user_id = sa.student_id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE sa.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create attendance
exports.create = async (req, res) => {
  try {
    const { student_id, attendance_date, status, remarks } = req.body;

    // Check duplicate
    const [existing] = await pool.query(
      `SELECT id FROM student_attendance WHERE student_id = ? AND attendance_date = ?`,
      [student_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this student on this date' });
    }

    const [result] = await pool.query(
      `INSERT INTO student_attendance (student_id, attendance_date, status, remarks)
       VALUES (?, ?, ?, ?)`,
      [student_id, attendance_date, status, remarks]
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
    const { status, remarks } = req.body;
    await pool.query(
      `UPDATE student_attendance SET status=?, remarks=? WHERE id=?`,
      [status, remarks, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (hard delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM student_attendance WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};