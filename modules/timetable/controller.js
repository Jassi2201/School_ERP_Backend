const pool = require('../../config/db');

// ========== Admin CRUD (unchanged) ==========
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM timetable t
      LEFT JOIN classes c ON c.id = t.class_id
      LEFT JOIN sections sec ON sec.id = t.section_id
      LEFT JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN users u ON u.id = t.teacher_id
      WHERE t.status = 'active'
      ORDER BY t.academic_year DESC, t.day_of_week, t.period_number
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
      SELECT t.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM timetable t
      LEFT JOIN classes c ON c.id = t.class_id
      LEFT JOIN sections sec ON sec.id = t.section_id
      LEFT JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN users u ON u.id = t.teacher_id
      WHERE t.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { class_id, section_id, day_of_week, period_number, subject_id, teacher_id, room, online_link, academic_year } = req.body;
    const [result] = await pool.query(
      `INSERT INTO timetable 
       (class_id, section_id, day_of_week, period_number, subject_id, teacher_id, room, online_link, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id, section_id, day_of_week, period_number, subject_id, teacher_id, room, online_link, academic_year]
    );
    res.json({ success: true, timetable_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Duplicate entry for this class, section, day, period, and academic year' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, section_id, day_of_week, period_number, subject_id, teacher_id, room, online_link, academic_year, status } = req.body;
    await pool.query(
      `UPDATE timetable SET
        class_id=?, section_id=?, day_of_week=?, period_number=?, subject_id=?, teacher_id=?,
        room=?, online_link=?, academic_year=?, status=?
       WHERE id=?`,
      [class_id, section_id, day_of_week, period_number, subject_id, teacher_id, room, online_link, academic_year, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE timetable SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyClasses = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [student] = await pool.query(
      `SELECT class_id, section_id FROM student_details WHERE user_id = ?`,
      [userId]
    );
    if (!student.length) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const { class_id, section_id } = student[0];
    const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

    const [todayRows, weekRows, teacherRows] = await Promise.all([
      pool.query(`
        SELECT t.*, s.name AS subject_name, u.full_name AS teacher_name
        FROM timetable t
        JOIN subjects s ON s.id = t.subject_id
        JOIN users u ON u.id = t.teacher_id
        WHERE t.class_id = ? AND t.section_id = ?
          AND t.day_of_week = ? AND t.status = 'active'
        ORDER BY t.period_number
      `, [class_id, section_id, today]),
      pool.query(`
        SELECT t.*, s.name AS subject_name, u.full_name AS teacher_name
        FROM timetable t
        JOIN subjects s ON s.id = t.subject_id
        JOIN users u ON u.id = t.teacher_id
        WHERE t.class_id = ? AND t.section_id = ?
          AND t.status = 'active'
        ORDER BY FIELD(t.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                 t.period_number
      `, [class_id, section_id]),
      pool.query(`
        SELECT DISTINCT s.name AS subject_name, u.full_name AS teacher_name
        FROM timetable t
        JOIN subjects s ON s.id = t.subject_id
        JOIN users u ON u.id = t.teacher_id
        WHERE t.class_id = ? AND t.section_id = ?
          AND t.status = 'active'
        ORDER BY s.name
      `, [class_id, section_id])
    ]);

    res.json({
      success: true,
      data: {
        today: todayRows[0],
        weekly: weekRows[0],
        subjectTeachers: teacherRows[0],
        // online links are already inside each timetable entry (t.online_link)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};