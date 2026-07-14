const pool = require('../../config/db');

// Get all attendance records
exports.getAll = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;

    let query = `
      SELECT sa.*,
             u.full_name AS student_name,
             c.name AS class,
             s.name AS section
      FROM student_attendance sa
      INNER JOIN users u ON u.id = sa.student_id
      LEFT JOIN student_details sd ON sd.user_id = sa.student_id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE 1=1
    `;
    const params = [];

    if (role_name === 'Student') {
      query += ' AND sa.student_id = ?';
      params.push(user_id);
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get one attendance record
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT sa.*,
             u.full_name AS student_name,
             c.name AS class,
             s.name AS section
      FROM student_attendance sa
      INNER JOIN users u ON u.id = sa.student_id
      LEFT JOIN student_details sd ON sd.user_id = sa.student_id
      LEFT JOIN classes c ON c.id = sd.class_id
      LEFT JOIN sections s ON s.id = sd.section_id
      WHERE sa.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create attendance
exports.create = async (req, res) => {
  try {
    const { student_id, attendance_date, status, remarks } = req.body;

    // Check duplicate
    const [existing] = await pool.query(
      `SELECT id FROM student_attendance WHERE student_id = ? AND attendance_date = ?`,
      [student_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this student on this date' });
    }

    const [result] = await pool.query(
      `INSERT INTO student_attendance (student_id, attendance_date, status, remarks)
       VALUES (?, ?, ?, ?)`,
      [student_id, attendance_date, status, remarks]
    );
    res.json({ success: true, attendance_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    await pool.query(
      `UPDATE student_attendance SET status=?, remarks=? WHERE id=?`,
      [status, remarks, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (hard delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM student_attendance WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== MOBILE DASHBOARD (Simplified & Fast) =====================
exports.getStudentAttendanceDashboard = async (req, res) => {
  try {
    const student_id = req.user.user_id;

    const [studentDetails] = await pool.query(
      `SELECT academic_year FROM student_details WHERE user_id = ?`,
      [student_id]
    );
    const academicYear = studentDetails.length ? studentDetails[0].academic_year : null;

    // Overall attendance
    const [percentageResult] = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS leave_count
      FROM student_attendance
      WHERE student_id = ? AND academic_year = ?
      `,
      [student_id, academicYear]
    );
    const totalDays = parseInt(percentageResult[0]?.total) || 0;
    const presentDays = parseInt(percentageResult[0]?.present_count) || 0;
    const absentDays = parseInt(percentageResult[0]?.absent_count) || 0;
    const leaveDays = parseInt(percentageResult[0]?.leave_count) || 0;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Monthly report (last 6 months)
    const [monthlyReport] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(attendance_date, '%Y-%m') AS month,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS leaves
      FROM student_attendance
      WHERE student_id = ? AND academic_year = ?
      GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
      `,
      [student_id, academicYear]
    );

    // Leave history (last 5)
    const [leaveHistory] = await pool.query(
      `
      SELECT id, leave_type, from_date, to_date, reason, leave_status, applied_date
      FROM student_leaves
      WHERE student_id = ? AND academic_year = ?
      ORDER BY applied_date DESC
      LIMIT 5
      `,
      [student_id, academicYear]
    );

    // Calendar – full date + status
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [calendarData] = await pool.query(
      `
      SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') AS date, status
      FROM student_attendance
      WHERE student_id = ? 
        AND MONTH(attendance_date) = ? 
        AND YEAR(attendance_date) = ?
        AND academic_year = ?
      ORDER BY attendance_date
      `,
      [student_id, currentMonth, currentYear, academicYear]
    );

    res.json({
      success: true,
      data: {
        academicYear,
        overall: {
          totalDays,
          presentDays,
          absentDays,
          leaveDays,
          percentage,
        },
        monthlyReport: monthlyReport || [],
        leaveHistory: leaveHistory || [],
        calendar: calendarData || [],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};