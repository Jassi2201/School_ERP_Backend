const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const moveNoticeFile = (tempPath, noticeId) => {
  const dir = path.join('uploads', 'notices', String(noticeId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(tempPath);
  const newName = `notice-${Date.now()}${ext}`;
  const newPath = path.join(dir, newName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/notices/${noticeId}/${newName}`;
};

// Get all active notices
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notices WHERE status = 'active' ORDER BY start_date DESC, created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single notice by ID
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM notices WHERE id = ? AND status = 'active'`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create notice
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { title, description, type, start_date, end_date } = req.body;

    const [result] = await connection.query(
      `INSERT INTO notices (title, description, type, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, type, start_date, end_date]
    );
    const noticeId = result.insertId;

    let attachment = null;
    if (req.file) {
      attachment = moveNoticeFile(req.file.path, noticeId);
      await connection.query(`UPDATE notices SET attachment = ? WHERE id = ?`, [attachment, noticeId]);
    }

    await connection.commit();
    res.json({ success: true, notice_id: noticeId });
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Update notice
exports.update = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { title, description, type, start_date, end_date, status } = req.body;

    let attachment = null;
    if (req.file) {
      // Delete old attachment
      const [old] = await connection.query(`SELECT attachment FROM notices WHERE id = ?`, [id]);
      if (old.length && old[0].attachment) {
        const oldPath = path.join(__dirname, '../../', old[0].attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      attachment = moveNoticeFile(req.file.path, id);
    }

    let updateQuery = `
      UPDATE notices SET
        title = ?, description = ?, type = ?, start_date = ?, end_date = ?, status = ?
    `;
    const params = [title, description, type, start_date, end_date, status];
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

// Soft delete
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE notices SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};