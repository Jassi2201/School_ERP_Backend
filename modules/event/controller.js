const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const moveEventFile = (tempPath, eventId) => {
  const dir = path.join('uploads', 'events', String(eventId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(tempPath);
  const newName = `event-${Date.now()}${ext}`;
  const newPath = path.join(dir, newName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/events/${eventId}/${newName}`;
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM events WHERE status = 'active' ORDER BY start_date DESC, created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM events WHERE id = ? AND status = 'active'`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { title, description, event_type, start_date, end_date, venue } = req.body;

    const [result] = await connection.query(
      `INSERT INTO events (title, description, event_type, start_date, end_date, venue)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, event_type, start_date, end_date, venue]
    );
    const eventId = result.insertId;

    let attachment = null;
    if (req.file) {
      attachment = moveEventFile(req.file.path, eventId);
      await connection.query(`UPDATE events SET attachment = ? WHERE id = ?`, [attachment, eventId]);
    }

    await connection.commit();
    res.json({ success: true, event_id: eventId });
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
    const { title, description, event_type, start_date, end_date, venue, status } = req.body;

    let attachment = null;
    if (req.file) {
      const [old] = await connection.query(`SELECT attachment FROM events WHERE id = ?`, [id]);
      if (old.length && old[0].attachment) {
        const oldPath = path.join(__dirname, '../../', old[0].attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      attachment = moveEventFile(req.file.path, id);
    }

    let updateQuery = `
      UPDATE events SET
        title = ?, description = ?, event_type = ?, start_date = ?, end_date = ?, venue = ?, status = ?
    `;
    const params = [title, description, event_type, start_date, end_date, venue, status];
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
    await pool.query(`UPDATE events SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};