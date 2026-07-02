const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

const moveFile = (tempPath, materialId) => {
  const dir = path.join('uploads', 'study_materials', String(materialId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(tempPath);
  const newName = `file-${Date.now()}${ext}`;
  const newPath = path.join(dir, newName);
  fs.renameSync(tempPath, newPath);
  return `/uploads/study_materials/${materialId}/${newName}`;
};

exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT sm.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM study_materials sm
      JOIN classes c ON c.id = sm.class_id
      JOIN sections sec ON sec.id = sm.section_id
      JOIN subjects s ON s.id = sm.subject_id
      JOIN users u ON u.id = sm.teacher_id
      WHERE sm.status = 'active'
    `;
    const params = [];
    if (role_name === 'Teacher') {
      query += ' AND sm.teacher_id = ?';
      params.push(user_id);
    } else if (role_name === 'Student') {
      const [student] = await pool.query(
        `SELECT class_id, section_id FROM student_details WHERE user_id = ?`,
        [user_id]
      );
      if (student.length) {
        query += ' AND sm.class_id = ? AND sm.section_id = ?';
        params.push(student[0].class_id, student[0].section_id);
      } else {
        return res.json({ success: true, data: [] });
      }
    }
    query += ' ORDER BY sm.created_at DESC';
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
      SELECT sm.*,
             c.name AS class_name, sec.name AS section_name,
             s.name AS subject_name, u.full_name AS teacher_name
      FROM study_materials sm
      JOIN classes c ON c.id = sm.class_id
      JOIN sections sec ON sec.id = sm.section_id
      JOIN subjects s ON s.id = sm.subject_id
      JOIN users u ON u.id = sm.teacher_id
      WHERE sm.id = ?
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
    const { class_id, section_id, subject_id, title, description, type, link_url } = req.body;
    const teacher_id = req.user.user_id;

    if (type === 'link' && !link_url) {
      return res.status(400).json({ success: false, message: 'Link URL required for type "link"' });
    }

    const [result] = await connection.query(
      `INSERT INTO study_materials
        (class_id, section_id, subject_id, teacher_id, title, description, type, link_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id, section_id, subject_id, teacher_id, title, description, type, link_url]
    );
    const materialId = result.insertId;

    let file_path = null;
    if (req.file && type !== 'link') {
      file_path = moveFile(req.file.path, materialId);
      await connection.query(
        `UPDATE study_materials SET file_path = ? WHERE id = ?`,
        [file_path, materialId]
      );
    }

    await connection.commit();
    res.json({ success: true, material_id: materialId });
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
    const { class_id, section_id, subject_id, title, description, type, link_url, status } = req.body;

    const [existing] = await connection.query(
      `SELECT teacher_id, file_path FROM study_materials WHERE id = ?`,
      [id]
    );
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing[0].teacher_id !== req.user.user_id && req.user.role_name !== 'Super Admin' && req.user.role_name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let file_path = existing[0].file_path;
    if (req.file && type !== 'link') {
      if (file_path) {
        const oldPath = path.join(__dirname, '../../', file_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      file_path = moveFile(req.file.path, id);
    }

    await connection.query(
      `UPDATE study_materials SET
        class_id = ?, section_id = ?, subject_id = ?, title = ?, description = ?,
        type = ?, link_url = ?, file_path = ?, status = ?
       WHERE id = ?`,
      [class_id, section_id, subject_id, title, description, type, link_url, file_path, status, id]
    );

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
    await pool.query(`UPDATE study_materials SET status = 'inactive' WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};