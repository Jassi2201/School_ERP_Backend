const pool = require('../../config/db');

exports.getExams = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT e.*,
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

exports.getExam = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT e.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name
      FROM exams e
      JOIN classes c ON c.id = e.class_id
      JOIN sections sec ON sec.id = e.section_id
      JOIN subjects s ON s.id = e.subject_id
      WHERE e.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { exam_type, name, class_id, section_id, subject_id, academic_year, max_marks, passing_marks, exam_date } = req.body;
    const [result] = await pool.query(
      `INSERT INTO exams (exam_type, name, class_id, section_id, subject_id, academic_year, max_marks, passing_marks, exam_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exam_type, name, class_id, section_id, subject_id, academic_year, max_marks, passing_marks, exam_date]
    );
    res.json({ success: true, exam_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_type, name, class_id, section_id, subject_id, academic_year, max_marks, passing_marks, exam_date, status } = req.body;
    await pool.query(
      `UPDATE exams SET
        exam_type = ?, name = ?, class_id = ?, section_id = ?, subject_id = ?,
        academic_year = ?, max_marks = ?, passing_marks = ?, exam_date = ?, status = ?
       WHERE id = ?`,
      [exam_type, name, class_id, section_id, subject_id, academic_year, max_marks, passing_marks, exam_date, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE exams SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};