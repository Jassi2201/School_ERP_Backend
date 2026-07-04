const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM transports WHERE status = 'active' ORDER BY route_name
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM transports WHERE id = ? AND status = 'active'`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transport not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { route_name, driver_name, driver_phone, pickup_time, drop_time, route_details } = req.body;
    const [result] = await pool.query(
      `INSERT INTO transports (route_name, driver_name, driver_phone, pickup_time, drop_time, route_details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [route_name, driver_name, driver_phone, pickup_time, drop_time, route_details]
    );
    res.json({ success: true, transport_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_name, driver_name, driver_phone, pickup_time, drop_time, route_details, status } = req.body;
    await pool.query(
      `UPDATE transports SET
        route_name = ?, driver_name = ?, driver_phone = ?, pickup_time = ?, drop_time = ?, route_details = ?, status = ?
       WHERE id = ?`,
      [route_name, driver_name, driver_phone, pickup_time, drop_time, route_details, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE transports SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};