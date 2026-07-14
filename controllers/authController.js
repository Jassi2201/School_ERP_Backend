const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const JWTUtils = require('../utils/jwt.util');

// ========== WEB LOGIN ==========
exports.login = async (req, res) => {
  try {
    const { login_id, password, fcm_token, device_type } = req.body;

    const [users] = await pool.query(
      `
      SELECT u.*, r.id AS role_id, r.role_name
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE u.login_id = ? AND u.status = 'active'
      `,
      [login_id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid Login ID",
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    if (fcm_token) {
      await pool.query(
        `UPDATE users SET fcm_token = ?, device_type = ? WHERE id = ?`,
        [fcm_token, device_type || 'web', user.id]
      );
    }

    const [moduleRows] = await pool.query(
      `
      SELECT m.module_name, m.module_code,
             p.can_view, p.can_create, p.can_update, p.can_delete
      FROM permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE p.role_id = ? AND p.status = 'active'
      `,
      [user.role_id]
    );

    const modules = moduleRows.map(m => ({
      module_name: m.module_name,
      module_code: m.module_code,
      can_view: !!m.can_view,
      can_create: !!m.can_create,
      can_update: !!m.can_update,
      can_delete: !!m.can_delete,
    }));

    const tokenPayload = {
      user_id: user.id,
      role_id: user.role_id,
      role_name: user.role_name,
    };
    const token = JWTUtils.generateToken(tokenPayload);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role_name,
      },
      modules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== MOBILE LOGIN – FULL USER DETAILS, NO MODULES ==========
exports.mobileLogin = async (req, res) => {
  try {
    const { login_id, password, fcm_token, device_type } = req.body;

    const [users] = await pool.query(
      `
      SELECT u.*, r.id AS role_id, r.role_name
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE u.login_id = ? AND u.status = 'active'
      `,
      [login_id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid Login ID",
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    if (fcm_token) {
      await pool.query(
        `UPDATE users SET fcm_token = ?, device_type = ? WHERE id = ?`,
        [fcm_token, device_type || 'android', user.id]
      );
    }

    // Fetch role‑specific profile with names instead of IDs
    let profile = null;
    if (user.role_name === 'Student') {
      const [student] = await pool.query(
        `
        SELECT sd.*,
               c.name AS class,
               sec.name AS section
        FROM student_details sd
        LEFT JOIN classes c ON c.id = sd.class_id
        LEFT JOIN sections sec ON sec.id = sd.section_id
        WHERE sd.user_id = ?
        `,
        [user.id]
      );
      if (student.length) {
        profile = student[0];
        // Optionally remove class_id and section_id if you only want names
        // delete profile.class_id;
        // delete profile.section_id;
      }
    } else if (user.role_name === 'Teacher') {
      const [teacher] = await pool.query(
        `SELECT * FROM teacher_details WHERE user_id = ?`,
        [user.id]
      );
      if (teacher.length) profile = teacher[0];
    }

    const tokenPayload = {
      user_id: user.id,
      role_id: user.role_id,
      role_name: user.role_name,
    };
    const token = JWTUtils.generateToken(tokenPayload);

    // ❌ Removed: delete user.password; (as requested)

    return res.json({
      success: true,
      token,
      user: {
        ...user,
        role: user.role_name,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};