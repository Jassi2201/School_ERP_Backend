const pool = require('../../config/db');

// Get all roles with active status and user count
exports.getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.role_name, r.status,
             (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
      FROM roles r
      ORDER BY r.id
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all modules with permissions for a specific role
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const [modules] = await pool.query(`
      SELECT m.id, m.module_code, m.module_name,
             COALESCE(p.can_view, 0) AS can_view,
             COALESCE(p.can_create, 0) AS can_create,
             COALESCE(p.can_update, 0) AS can_update,
             COALESCE(p.can_delete, 0) AS can_delete,
             p.status AS permission_status
      FROM modules m
      LEFT JOIN permissions p ON p.module_id = m.id AND p.role_id = ?
      WHERE m.status = 'active'
      ORDER BY m.module_name
    `, [roleId]);
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update permissions for a role (batch upsert)
exports.updateRolePermissions = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { roleId } = req.params;
    const { permissions } = req.body; // array of { module_id, can_view, can_create, can_update, can_delete }

    // Delete all existing permissions for this role (simplest)
    await connection.query(`DELETE FROM permissions WHERE role_id = ?`, [roleId]);

    // Insert new permissions (only those with at least one flag = 1)
    for (const perm of permissions) {
      const { module_id, can_view, can_create, can_update, can_delete } = perm;
      if (can_view || can_create || can_update || can_delete) {
        await connection.query(`
          INSERT INTO permissions (role_id, module_id, can_view, can_create, can_update, can_delete, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [roleId, module_id, can_view, can_create, can_update, can_delete]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};