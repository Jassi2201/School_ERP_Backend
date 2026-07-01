const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ====================== HELPER ======================
const moveFileToStudentFolder = (tempPath, userId) => {
  const studentDir = path.join('uploads', 'students', String(userId));
  if (!fs.existsSync(studentDir)) {
    fs.mkdirSync(studentDir, { recursive: true });
  }
  const ext = path.extname(tempPath);
  const newFileName = `profile-${Date.now()}${ext}`;
  const newPath = path.join(studentDir, newFileName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/students/${userId}/${newFileName}`;
};

// ====================== CRUD ======================

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.mobile, u.status,
             c.name AS class, s.name AS section,
             sd.father_name, sd.mother_name, sd.dob,
             sd.gender, sd.profile_picture, sd.roll_number,
             sd.admission_date, sd.address,
             sd.father_phone, sd.mother_phone,
             sd.blood_group, sd.father_occupation, sd.mother_occupation, sd.sibling_details,
             sd.class_id, sd.section_id
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      LEFT JOIN student_details sd ON sd.user_id = u.id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE r.role_name = 'Student'
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
      SELECT u.*, sd.*,
             c.id AS class_id, c.name AS class_name,
             s.id AS section_id, s.name AS section_name
      FROM users u
      LEFT JOIN student_details sd ON sd.user_id = u.id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE u.id = ? AND u.status = 'active'
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  let tempPath = null;
  try {
    await connection.beginTransaction();

    const {
      login_id, password, full_name, email, mobile,
      class_id, section_id,
      father_name, mother_name, dob,
      gender, roll_number, admission_date,
      address, father_phone, mother_phone,
      blood_group, father_occupation, mother_occupation, sibling_details
    } = req.body;

    if (req.file) tempPath = req.file.path;

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, password, full_name, email, mobile, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [login_id, hashed, full_name, email, mobile]
    );
    const userId = userResult.insertId;

    const [roleRow] = await connection.query(`SELECT id FROM roles WHERE role_name = 'Student'`);
    await connection.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleRow[0].id]);

    let profile_picture = null;
    if (tempPath && fs.existsSync(tempPath)) {
      profile_picture = moveFileToStudentFolder(tempPath, userId);
    }

    await connection.query(
      `INSERT INTO student_details 
        (user_id, class_id, section_id, father_name, mother_name, dob,
         gender, profile_picture, roll_number, admission_date,
         address, father_phone, mother_phone,
         blood_group, father_occupation, mother_occupation, sibling_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, class_id, section_id, father_name, mother_name, dob,
       gender, profile_picture, roll_number, admission_date,
       address, father_phone, mother_phone,
       blood_group, father_occupation, mother_occupation, sibling_details]
    );

    await connection.commit();
    res.json({ success: true, student_id: userId });
  } catch (error) {
    await connection.rollback();
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  let tempPath = null;
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      full_name, email, mobile,
      class_id, section_id,
      father_name, mother_name, dob,
      gender, roll_number, admission_date,
      address, father_phone, mother_phone,
      blood_group, father_occupation, mother_occupation, sibling_details
    } = req.body;

    if (req.file) tempPath = req.file.path;

    await connection.query(
      `UPDATE users SET full_name=?, email=?, mobile=? WHERE id=?`,
      [full_name, email, mobile, id]
    );

    const [existing] = await connection.query(
      `SELECT profile_picture FROM student_details WHERE user_id = ?`,
      [id]
    );
    const oldPicture = existing.length > 0 ? existing[0].profile_picture : null;

    let profile_picture = oldPicture;
    if (tempPath && fs.existsSync(tempPath)) {
      if (oldPicture) {
        const oldPath = path.join(__dirname, '../../', oldPicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      profile_picture = moveFileToStudentFolder(tempPath, id);
    }

    await connection.query(
      `INSERT INTO student_details 
        (user_id, class_id, section_id, father_name, mother_name, dob,
         gender, profile_picture, roll_number, admission_date,
         address, father_phone, mother_phone,
         blood_group, father_occupation, mother_occupation, sibling_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         class_id = VALUES(class_id),
         section_id = VALUES(section_id),
         father_name = VALUES(father_name),
         mother_name = VALUES(mother_name),
         dob = VALUES(dob),
         gender = VALUES(gender),
         profile_picture = IFNULL(VALUES(profile_picture), profile_picture),
         roll_number = VALUES(roll_number),
         admission_date = VALUES(admission_date),
         address = VALUES(address),
         father_phone = VALUES(father_phone),
         mother_phone = VALUES(mother_phone),
         blood_group = VALUES(blood_group),
         father_occupation = VALUES(father_occupation),
         mother_occupation = VALUES(mother_occupation),
         sibling_details = VALUES(sibling_details)`,
      [id, class_id, section_id, father_name, mother_name, dob,
       gender, profile_picture, roll_number, admission_date,
       address, father_phone, mother_phone,
       blood_group, father_occupation, mother_occupation, sibling_details]
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

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};