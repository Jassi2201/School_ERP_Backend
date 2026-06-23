const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ====================== HELPER ======================
// Moves a temp file to the teacher's folder and returns the relative path with leading slash
const moveFileToTeacherFolder = (tempPath, teacherId) => {
  const teacherDir = path.join('uploads', 'teachers', String(teacherId));
  if (!fs.existsSync(teacherDir)) {
    fs.mkdirSync(teacherDir, { recursive: true });
  }
  const ext = path.extname(tempPath);
  const newFileName = `profile-${Date.now()}${ext}`;
  const newPath = path.join(teacherDir, newFileName);
  fs.renameSync(tempPath, newPath);
  // ✅ Returns with leading slash
  return `/uploads/teachers/${teacherId}/${newFileName}`;
};

// ====================== CRUD ======================

// Get all teachers
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.mobile, u.status,
             td.department, td.qualification, td.joining_date, td.subject,
             td.gender, td.date_of_birth, td.profile_picture
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      LEFT JOIN teacher_details td ON td.user_id = u.id
      WHERE r.role_name = 'Teacher'
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get one teacher
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT u.*, td.*
      FROM users u
      LEFT JOIN teacher_details td ON td.user_id = u.id
      WHERE u.id = ? AND u.status = 'active'
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create teacher
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  let tempPath = null;
  try {
    await connection.beginTransaction();

    const {
      login_id, password, full_name, email, mobile,
      department, qualification, joining_date, subject,
      gender, date_of_birth
    } = req.body;

    if (req.file) tempPath = req.file.path; // uploads/temp/...

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, password, full_name, email, mobile, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [login_id, hashed, full_name, email, mobile]
    );
    const userId = userResult.insertId;

    const [roleRow] = await connection.query(`SELECT id FROM roles WHERE role_name = 'Teacher'`);
    await connection.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleRow[0].id]);

    // Move file to teacher folder if uploaded
    let profile_picture = null;
    if (tempPath && fs.existsSync(tempPath)) {
      profile_picture = moveFileToTeacherFolder(tempPath, userId);
    }

    await connection.query(
      `INSERT INTO teacher_details 
        (user_id, department, qualification, joining_date, subject, gender, date_of_birth, profile_picture)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, department, qualification, joining_date, subject, gender, date_of_birth, profile_picture]
    );

    await connection.commit();
    res.json({ success: true, teacher_id: userId });
  } catch (error) {
    await connection.rollback();
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Update teacher
exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  let tempPath = null;
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      full_name, email, mobile,
      department, qualification, joining_date, subject,
      gender, date_of_birth
    } = req.body;

    if (req.file) tempPath = req.file.path;

    await connection.query(`UPDATE users SET full_name=?, email=?, mobile=? WHERE id=?`,
      [full_name, email, mobile, id]);

    // Get existing profile picture to delete old file
    const [existing] = await connection.query(
      `SELECT profile_picture FROM teacher_details WHERE user_id = ?`,
      [id]
    );
    const oldPicture = existing.length > 0 ? existing[0].profile_picture : null;

    let profile_picture = oldPicture;
    if (tempPath && fs.existsSync(tempPath)) {
      // Delete old file if exists
      if (oldPicture) {
        // oldPicture starts with '/', so we need to join with __dirname correctly
        const oldPath = path.join(__dirname, '../../', oldPicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      profile_picture = moveFileToTeacherFolder(tempPath, id);
    }

    await connection.query(
      `INSERT INTO teacher_details 
        (user_id, department, qualification, joining_date, subject, gender, date_of_birth, profile_picture)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         department = VALUES(department),
         qualification = VALUES(qualification),
         joining_date = VALUES(joining_date),
         subject = VALUES(subject),
         gender = VALUES(gender),
         date_of_birth = VALUES(date_of_birth),
         profile_picture = IFNULL(VALUES(profile_picture), profile_picture)`,
      [id, department, qualification, joining_date, subject, gender, date_of_birth, profile_picture]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Soft delete
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};