const router = require('express').Router();
const controller = require('./controller');

// For dropdown
router.get('/exams', controller.getExamsForDropdown);

// Marks operations
router.get('/exams/:examId/students', controller.getStudentsForExam);
router.get('/exams/:examId/marks', controller.getMarks);
router.post('/exams/:examId/marks', controller.saveMarks);

// Grades
router.get('/grades', controller.getGrades);

module.exports = router;