const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT st.*,
             u.full_name AS student_name,
             t.route_name, t.driver_name, t.driver_phone, t.pickup_time, t.drop_time
      FROM student_transports st
      JOIN users u ON u.id = st.student_id
      JOIN transports t ON t.id = st.transport_id
      WHERE st.status = 'active'
      ORDER BY u.full_name
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
      SELECT st.*,
             u.full_name AS student_name,
             t.route_name, t.driver_name, t.driver_phone, t.pickup_time, t.drop_time
      FROM student_transports st
      JOIN users u ON u.id = st.student_id
      JOIN transports t ON t.id = st.transport_id
      WHERE st.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { student_id, transport_id, pickup_point, drop_point } = req.body;
    // Check duplicate
    const [existing] = await pool.query(
      `SELECT id FROM student_transports WHERE student_id = ? AND transport_id = ?`,
      [student_id, transport_id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Student already assigned to this route.' });
    }
    const [result] = await pool.query(
      `INSERT INTO student_transports (student_id, transport_id, pickup_point, drop_point)
       VALUES (?, ?, ?, ?)`,
      [student_id, transport_id, pickup_point, drop_point]
    );
    res.json({ success: true, assignment_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, transport_id, pickup_point, drop_point, status } = req.body;
    await pool.query(
      `UPDATE student_transports SET
        student_id = ?, transport_id = ?, pickup_point = ?, drop_point = ?, status = ?
       WHERE id = ?`,
      [student_id, transport_id, pickup_point, drop_point, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE student_transports SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ===================== MOBILE: STUDENT TRANSPORT =====================
exports.getMyTransport = async (req, res) => {
  try {
    const student_id = req.user.user_id;

    const [rows] = await pool.query(
      `
      SELECT st.*,
             t.route_name, t.driver_name, t.driver_phone, 
             t.pickup_time, t.drop_time,
             u.full_name AS student_name
      FROM student_transports st
      JOIN transports t ON t.id = st.transport_id
      JOIN users u ON u.id = st.student_id
      WHERE st.student_id = ? AND st.status = 'active'
      `,
      [student_id]
    );

    if (!rows.length) {
      return res.json({
        success: true,
        data: null,
        message: 'No transport assigned to this student.'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};