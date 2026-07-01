const pool = require('../../config/db');

// ========== CLASSES ==========
exports.getAllClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(s.id) AS section_count
      FROM classes c
      LEFT JOIN sections s ON s.class_id = c.id AND s.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query(
      `INSERT INTO classes (name) VALUES (?)`,
      [name]
    );
    res.json({ success: true, class_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    await pool.query(
      `UPDATE classes SET name=?, status=? WHERE id=?`,
      [name, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE classes SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SECTIONS ==========
exports.getSectionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM sections WHERE class_id = ? AND status = 'active'`,
      [classId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const { class_id, name } = req.body;
    const [result] = await pool.query(
      `INSERT INTO sections (class_id, name) VALUES (?, ?)`,
      [class_id, name]
    );
    res.json({ success: true, section_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    await pool.query(
      `UPDATE sections SET name=?, status=? WHERE id=?`,
      [name, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE sections SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};