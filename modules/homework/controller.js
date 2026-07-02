const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Helper – move uploaded file to homework folder
const moveHomeworkFile = (tempPath, homeworkId, type = 'attachment') => {
  const dir = path.join('uploads', 'homework', String(homeworkId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(tempPath);
  const newName = `${type}-${Date.now()}${ext}`;
  const newPath = path.join(dir, newName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/homework/${homeworkId}/${newName}`;
};

// ===================== HOMEWORK CRUD =====================

// Get all homework (filtered by role)
exports.getAllHomework = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT h.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM homework h
      JOIN classes c ON c.id = h.class_id
      JOIN sections sec ON sec.id = h.section_id
      JOIN subjects s ON s.id = h.subject_id
      JOIN users u ON u.id = h.teacher_id
      WHERE h.status = 'active'
    `;
    const params = [];
    if (role_name === 'Teacher') {
      query += ' AND h.teacher_id = ?';
      params.push(user_id);
    } else if (role_name === 'Student') {
      // For student, we need to get their class/section
      const [student] = await pool.query(
        `SELECT class_id, section_id FROM student_details WHERE user_id = ?`,
        [user_id]
      );
      if (student.length) {
        query += ' AND h.class_id = ? AND h.section_id = ?';
        params.push(student[0].class_id, student[0].section_id);
      } else {
        return res.json({ success: true, data: [] });
      }
    }
    query += ' ORDER BY h.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single homework
exports.getHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT h.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM homework h
      JOIN classes c ON c.id = h.class_id
      JOIN sections sec ON sec.id = h.section_id
      JOIN subjects s ON s.id = h.subject_id
      JOIN users u ON u.id = h.teacher_id
      WHERE h.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Homework not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create homework (teacher only)
exports.createHomework = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { class_id, section_id, subject_id, title, description, due_date } = req.body;
    const teacher_id = req.user.user_id; // from JWT

    const [result] = await connection.query(
      `INSERT INTO homework (class_id, section_id, subject_id, teacher_id, title, description, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [class_id, section_id, subject_id, teacher_id, title, description, due_date]
    );
    const homeworkId = result.insertId;

    let attachment = null;
    if (req.file) {
      attachment = moveHomeworkFile(req.file.path, homeworkId, 'attachment');
    }

    if (attachment) {
      await connection.query(
        `UPDATE homework SET attachment = ? WHERE id = ?`,
        [attachment, homeworkId]
      );
    }

    await connection.commit();
    res.json({ success: true, homework_id: homeworkId });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Update homework
exports.updateHomework = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { class_id, section_id, subject_id, title, description, due_date, status } = req.body;
    const teacher_id = req.user.user_id;

    // Check ownership (only teacher who created can edit)
    const [existing] = await connection.query(
      `SELECT teacher_id FROM homework WHERE id = ?`,
      [id]
    );
    if (!existing.length) return res.status(404).json({ success: false, message: 'Homework not found' });
    if (existing[0].teacher_id !== teacher_id && req.user.role_name !== 'Super Admin' && req.user.role_name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this homework' });
    }

    let attachment = null;
    if (req.file) {
      // Delete old attachment if exists
      const [old] = await connection.query(`SELECT attachment FROM homework WHERE id = ?`, [id]);
      if (old.length && old[0].attachment) {
        const oldPath = path.join(__dirname, '../../', old[0].attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      attachment = moveHomeworkFile(req.file.path, id, 'attachment');
    }

    let updateQuery = `
      UPDATE homework SET
        class_id = ?, section_id = ?, subject_id = ?, title = ?, description = ?, due_date = ?, status = ?
    `;
    const params = [class_id, section_id, subject_id, title, description, due_date, status];
    if (attachment) {
      updateQuery += ', attachment = ?';
      params.push(attachment);
    }
    updateQuery += ' WHERE id = ?';
    params.push(id);

    await connection.query(updateQuery, params);
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Delete homework (soft delete)
exports.deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE homework SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== SUBMISSIONS =====================

// Get submissions for a homework (teacher only)
exports.getSubmissions = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const [rows] = await pool.query(`
      SELECT hs.*,
             u.full_name AS student_name,
             u.email, u.mobile
      FROM homework_submissions hs
      JOIN users u ON u.id = hs.student_id
      WHERE hs.homework_id = ?
      ORDER BY hs.submitted_at DESC
    `, [homeworkId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Student submits homework
exports.submitHomework = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { homeworkId } = req.params;
    const student_id = req.user.user_id;
    const { submission_text } = req.body;

    // Check if already submitted
    const [existing] = await connection.query(
      `SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ?`,
      [homeworkId, student_id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'You have already submitted this homework' });
    }

    let attachment = null;
    if (req.file) {
      const dir = path.join('uploads', 'homework_submissions', String(homeworkId));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(req.file.path);
      const newName = `sub-${student_id}-${Date.now()}${ext}`;
      const newPath = path.join(dir, newName);
      fs.renameSync(req.file.path, newPath);
      attachment = `/uploads/homework_submissions/${homeworkId}/${newName}`;
    }

    await connection.query(
      `INSERT INTO homework_submissions (homework_id, student_id, submission_text, attachment, status)
       VALUES (?, ?, ?, ?, 'Submitted')`,
      [homeworkId, student_id, submission_text, attachment]
    );

    await connection.commit();
    res.json({ success: true, message: 'Homework submitted successfully' });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Teacher evaluates submission
exports.evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, marks, teacher_remarks } = req.body;
    await pool.query(
      `UPDATE homework_submissions SET status = ?, marks = ?, teacher_remarks = ? WHERE id = ?`,
      [status, marks, teacher_remarks, submissionId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};