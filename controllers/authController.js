const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { login_id, password } = req.body;

    const [users] = await pool.query(
      `
      SELECT u.id, u.login_id, u.password, u.full_name,
             r.id AS role_id, r.role_name
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

    // ✅ Convert 0/1 to booleans (industry standard)
    const modules = moduleRows.map(m => ({
      module_name: m.module_name,
      module_code: m.module_code,
      can_view: !!m.can_view,
      can_create: !!m.can_create,
      can_update: !!m.can_update,
      can_delete: !!m.can_delete,
    }));

    const token = jwt.sign(
      {
        user_id: user.id,
        role_id: user.role_id,
        role_name: user.role_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        full_name: user.full_name,
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