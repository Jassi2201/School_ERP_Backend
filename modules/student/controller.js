const pool = require('../../config/db');

// Get all students (with details)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.mobile, u.status,
             sd.class, sd.section, sd.father_name, sd.mother_name, sd.dob
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      LEFT JOIN student_details sd ON sd.user_id = u.id
      WHERE r.role_name = 'Student'
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single student by id
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT u.*, sd.*
      FROM users u
      LEFT JOIN student_details sd ON sd.user_id = u.id
      WHERE u.id = ? AND u.status = 'active'
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create student (user + student_details)
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { login_id, password, full_name, email, mobile, class: cls, section, father_name, mother_name, dob } = req.body;

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    // Insert into users
    const [userResult] = await connection.query(`
      INSERT INTO users (login_id, password, full_name, email, mobile, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [login_id, hashed, full_name, email, mobile]);

    const userId = userResult.insertId;

    // Assign role 'Student' (role_id = 4 if inserted in order)
    const [roleRow] = await connection.query(`SELECT id FROM roles WHERE role_name = 'Student'`);
    const roleId = roleRow[0].id;
    await connection.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleId]);

    // Insert student details
    await connection.query(`
      INSERT INTO student_details (user_id, class, section, father_name, mother_name, dob)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, cls, section, father_name, mother_name, dob]);

    await connection.commit();
    res.json({ success: true, student_id: userId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Update student
exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { full_name, email, mobile, class: cls, section, father_name, mother_name, dob } = req.body;

    // Update users
    await connection.query(`
      UPDATE users SET full_name=?, email=?, mobile=? WHERE id=?
    `, [full_name, email, mobile, id]);

    // Update student_details (upsert)
    await connection.query(`
      INSERT INTO student_details (user_id, class, section, father_name, mother_name, dob)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE class=VALUES(class), section=VALUES(section),
                              father_name=VALUES(father_name), mother_name=VALUES(mother_name),
                              dob=VALUES(dob)
    `, [id, cls, section, father_name, mother_name, dob]);

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