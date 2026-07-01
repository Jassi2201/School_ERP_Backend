const pool = require('../../config/db');

const ALLOWED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get all links (including those without timetable match)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT oml.*,
             c.name AS class_name,
             sec.name AS section_name,
             s.name AS subject_name,
             u.full_name AS teacher_name
      FROM online_meet_links oml
      JOIN classes c ON c.id = oml.class_id
      JOIN sections sec ON sec.id = oml.section_id
      JOIN subjects s ON s.id = oml.subject_id
      LEFT JOIN timetable t ON t.class_id = oml.class_id 
          AND t.section_id = oml.section_id 
          AND t.subject_id = oml.subject_id
          AND t.day_of_week = oml.day_of_week
          AND t.period_number = oml.period_number
          AND t.status = 'active'
      LEFT JOIN users u ON u.id = t.teacher_id
      WHERE oml.status = 'active'
      ORDER BY oml.class_id, oml.section_id, FIELD(oml.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), oml.period_number
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get one link by ID
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT oml.*,
             c.name AS class_name,
             sec.name AS section_name,
             s.name AS subject_name,
             u.full_name AS teacher_name
      FROM online_meet_links oml
      JOIN classes c ON c.id = oml.class_id
      JOIN sections sec ON sec.id = oml.section_id
      JOIN subjects s ON s.id = oml.subject_id
      LEFT JOIN timetable t ON t.class_id = oml.class_id 
          AND t.section_id = oml.section_id 
          AND t.subject_id = oml.subject_id
          AND t.day_of_week = oml.day_of_week
          AND t.period_number = oml.period_number
          AND t.status = 'active'
      LEFT JOIN users u ON u.id = t.teacher_id
      WHERE oml.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Link not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new link
exports.create = async (req, res) => {
  try {
    const { class_id, section_id, subject_id, day_of_week, period_number, link } = req.body;

    if (!ALLOWED_DAYS.includes(day_of_week)) {
      return res.status(400).json({ success: false, message: 'Sunday is not allowed for meet links.' });
    }

    const [result] = await pool.query(
      `INSERT INTO online_meet_links 
        (class_id, section_id, subject_id, day_of_week, period_number, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id, section_id, subject_id, day_of_week, period_number, link]
    );
    res.json({ success: true, link_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a link
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, section_id, subject_id, day_of_week, period_number, link, status } = req.body;

    if (!ALLOWED_DAYS.includes(day_of_week)) {
      return res.status(400).json({ success: false, message: 'Sunday is not allowed for meet links.' });
    }

    await pool.query(
      `UPDATE online_meet_links SET
        class_id = ?, section_id = ?, subject_id = ?, day_of_week = ?,
        period_number = ?, link = ?, status = ?
       WHERE id = ?`,
      [class_id, section_id, subject_id, day_of_week, period_number, link, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE online_meet_links SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};