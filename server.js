require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require('path');

const auth = require("./middleware/auth");
const checkPermission = require("./middleware/checkPermission");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School ERP Running",
  });
});

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use('/api/student', auth, checkPermission('STUDENT'), require('./modules/student/routes'));
app.use(
  '/api/teacher',
  auth,
  checkPermission('TEACHER'),
  require('./modules/teacher/routes')
);

app.use('/api/student-attendance', auth, checkPermission('STUDENT_ATTENDANCE'), require('./modules/student-attendance/routes'));
app.use('/api/teacher-attendance', auth, checkPermission('TEACHER_ATTENDANCE'), require('./modules/teacher-attendance/routes'));
app.use('/api/role-permissions', auth, checkPermission('ROLE_PERMISSION'), require('./modules/role-permissions/routes'));
app.use('/api/class-section', auth, checkPermission('CLASS_SECTION'), require('./modules/class-section/routes'));
app.use('/api/class-teachers', auth, checkPermission('CLASS_TEACHERS'), require('./modules/class-teachers/routes'));
app.use('/api/subjects', auth, checkPermission('SUBJECTS'), require('./modules/subjects/routes'));
app.use('/api/timetable', auth, checkPermission('TIMETABLE'), require('./modules/timetable/routes'));
app.use('/api/online-meet-links', auth, checkPermission('ONLINE_MEET_LINKS'), require('./modules/online-meet-links/routes'));
app.use('/api/homework', auth, checkPermission('HOMEWORK'), require('./modules/homework/routes'));
app.use('/api/study-material', auth, checkPermission('STUDY_MATERIAL'), require('./modules/study-material/routes'));
app.use('/api/exam', auth, checkPermission('EXAM'), require('./modules/exam/routes'));
app.use('/api/result', auth, checkPermission('RESULT'), require('./modules/result/routes'));

app.listen(
  process.env.PORT,
  () => {
    console.log(
      `Server Running On Port ${process.env.PORT}`
    );
  }
);
