const pool = require("../config/db");

module.exports = (moduleCode) => {
  return async (req, res, next) => {
    try {

      const roleId = req.user.role_id;

      const [rows] = await pool.query(
        `
        SELECT
            p.can_view,
            p.can_create,
            p.can_update,
            p.can_delete
        FROM permissions p
        INNER JOIN modules m
            ON m.id = p.module_id
        WHERE p.role_id = ?
        AND m.module_code = ?
        AND p.status='active'
        AND m.status='active'
        `,
        [roleId, moduleCode]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Module access denied",
        });
      }

      const permission = rows[0];

      let allowed = false;

      switch (req.method) {

        case "GET":
          allowed = permission.can_view;
          break;

        case "POST":
          allowed = permission.can_create;
          break;

        case "PUT":
        case "PATCH":
          allowed = permission.can_update;
          break;

        case "DELETE":
          allowed = permission.can_delete;
          break;
      }

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      next();

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
};