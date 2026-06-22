const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

// Get all teachers
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.mobile, u.status,
             td.department, td.qualification, td.joining_date, td.subject
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

// Get one teacher by ID
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

// Create teacher (user + teacher_details)
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { login_id, password, full_name, email, mobile, department, qualification, joining_date, subject } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, password, full_name, email, mobile, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [login_id, hashed, full_name, email, mobile]
    );
    const userId = userResult.insertId;

    const [roleRow] = await connection.query(`SELECT id FROM roles WHERE role_name = 'Teacher'`);
    await connection.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleRow[0].id]);

    await connection.query(
      `INSERT INTO teacher_details (user_id, department, qualification, joining_date, subject)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, department, qualification, joining_date, subject]
    );

    await connection.commit();
    res.json({ success: true, teacher_id: userId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Update teacher
exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { full_name, email, mobile, department, qualification, joining_date, subject } = req.body;

    await connection.query(`UPDATE users SET full_name=?, email=?, mobile=? WHERE id=?`,
      [full_name, email, mobile, id]);

    await connection.query(
      `INSERT INTO teacher_details (user_id, department, qualification, joining_date, subject)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE department=VALUES(department), qualification=VALUES(qualification),
                               joining_date=VALUES(joining_date), subject=VALUES(subject)`,
      [id, department, qualification, joining_date, subject]
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

// Delete (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};