const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const moveFile = (tempPath, achievementId) => {
  const dir = path.join('uploads', 'achievements', String(achievementId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(tempPath);
  const newName = `ach-${Date.now()}${ext}`;
  const newPath = path.join(dir, newName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/achievements/${achievementId}/${newName}`;
};

exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT sa.*, u.full_name AS student_name
      FROM student_achievements sa
      JOIN users u ON u.id = sa.student_id
      WHERE sa.status = 'active'
    `;
    const params = [];
    if (role_name === 'Student') {
      query += ' AND sa.student_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY sa.achievement_date DESC, sa.id DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT sa.*, u.full_name AS student_name
      FROM student_achievements sa
      JOIN users u ON u.id = sa.student_id
      WHERE sa.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { student_id, achievement_type, title, description, achievement_date, level } = req.body;

    const [result] = await connection.query(
      `INSERT INTO student_achievements (student_id, achievement_type, title, description, achievement_date, level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, achievement_type, title, description, achievement_date, level]
    );
    const achievementId = result.insertId;

    let attachment = null;
    if (req.file) {
      attachment = moveFile(req.file.path, achievementId);
      await connection.query(
        `UPDATE student_achievements SET attachment = ? WHERE id = ?`,
        [attachment, achievementId]
      );
    }

    await connection.commit();
    res.json({ success: true, achievement_id: achievementId });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { student_id, achievement_type, title, description, achievement_date, level, status } = req.body;

    let attachment = null;
    if (req.file) {
      const [old] = await connection.query(`SELECT attachment FROM student_achievements WHERE id = ?`, [id]);
      if (old.length && old[0].attachment) {
        const oldPath = path.join(__dirname, '../../', old[0].attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      attachment = moveFile(req.file.path, id);
    }

    let updateQuery = `
      UPDATE student_achievements SET
        student_id = ?, achievement_type = ?, title = ?, description = ?,
        achievement_date = ?, level = ?, status = ?
    `;
    const params = [student_id, achievement_type, title, description, achievement_date, level, status];
    if (attachment) {
      updateQuery += ', attachment = ?';
      params.push(attachment);
    }
    updateQuery += ' WHERE id = ?';
    params.push(id);

    await connection.query(updateQuery, params);
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE student_achievements SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};