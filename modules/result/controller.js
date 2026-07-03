const pool = require('../../config/db');

// Get all exams (for dropdown) – we can use the same as exam list, but with limited fields
exports.getExamsForDropdown = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT e.id, e.name, e.class_id, e.section_id, e.subject_id,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name
      FROM exams e
      JOIN classes c ON c.id = e.class_id
      JOIN sections sec ON sec.id = e.section_id
      JOIN subjects s ON s.id = e.subject_id
      WHERE e.status = 'active'
    `;
    const params = [];
    if (role_name === 'Teacher') {
      query += ` AND e.subject_id IN (
        SELECT subject_id FROM teacher_allotments WHERE teacher_id = ?
      )`;
      params.push(user_id);
    } else if (role_name === 'Student') {
      const [student] = await pool.query(
        `SELECT class_id, section_id FROM student_details WHERE user_id = ?`,
        [user_id]
      );
      if (student.length) {
        query += ' AND e.class_id = ? AND e.section_id = ?';
        params.push(student[0].class_id, student[0].section_id);
      } else {
        return res.json({ success: true, data: [] });
      }
    }
    query += ' ORDER BY e.exam_date DESC, e.id DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get marks for a specific exam
exports.getMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const [rows] = await pool.query(`
      SELECT em.*,
             u.full_name AS student_name,
             u.id AS student_id
      FROM exam_marks em
      JOIN users u ON u.id = em.student_id
      WHERE em.exam_id = ? AND em.status = 'active'
      ORDER BY u.full_name
    `, [examId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get students for a class/section (to display in marks entry)
exports.getStudentsForExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const [exam] = await pool.query(`SELECT class_id, section_id FROM exams WHERE id = ?`, [examId]);
    if (!exam.length) return res.status(404).json({ success: false, message: 'Exam not found' });
    const { class_id, section_id } = exam[0];
    const [rows] = await pool.query(`
      SELECT u.id, u.full_name, sd.roll_number
      FROM users u
      JOIN student_details sd ON sd.user_id = u.id
      WHERE sd.class_id = ? AND sd.section_id = ? AND u.status = 'active'
      ORDER BY u.full_name
    `, [class_id, section_id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save marks (bulk upsert)
exports.saveMarks = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { examId } = req.params;
    const { marks } = req.body; // array of { student_id, marks_obtained, grade, remarks }

    for (const item of marks) {
      await connection.query(
        `INSERT INTO exam_marks (exam_id, student_id, marks_obtained, grade, remarks)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           marks_obtained = VALUES(marks_obtained),
           grade = VALUES(grade),
           remarks = VALUES(remarks)`,
        [examId, item.student_id, item.marks_obtained, item.grade, item.remarks]
      );
    }
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Get grades
exports.getGrades = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM grades WHERE status = 'active' ORDER BY min_marks DESC`);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};