require("dotenv").config();

const express = require("express");
const cors = require("cors");

const auth = require("./middleware/auth");
const checkPermission = require("./middleware/checkPermission");

const app = express();

app.use(cors());
app.use(express.json());

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

app.listen(
  process.env.PORT,
  () => {
    console.log(
      `Server Running On Port ${process.env.PORT}`
    );
  }
);

//Testing