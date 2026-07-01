const pool = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ct.*,
             u.full_name AS teacher_name,
             c.name AS class_name,
             s.name AS section_name
      FROM class_teachers ct
      INNER JOIN users u ON u.id = ct.teacher_id
      INNER JOIN classes c ON c.id = ct.class_id
      INNER JOIN sections s ON s.id = ct.section_id
      WHERE ct.status = 'active'
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
      SELECT ct.*, u.full_name AS teacher_name, c.name AS class_name, s.name AS section_name
      FROM class_teachers ct
      INNER JOIN users u ON u.id = ct.teacher_id
      INNER JOIN classes c ON c.id = ct.class_id
      INNER JOIN sections s ON s.id = ct.section_id
      WHERE ct.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { teacher_id, class_id, section_id, academic_year } = req.body;
    const [result] = await pool.query(
      `INSERT INTO class_teachers (teacher_id, class_id, section_id, academic_year) VALUES (?, ?, ?, ?)`,
      [teacher_id, class_id, section_id, academic_year]
    );
    res.json({ success: true, class_teacher_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, class_id, section_id, academic_year, status } = req.body;
    await pool.query(
      `UPDATE class_teachers SET teacher_id=?, class_id=?, section_id=?, academic_year=?, status=? WHERE id=?`,
      [teacher_id, class_id, section_id, academic_year, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE class_teachers SET status='inactive' WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};