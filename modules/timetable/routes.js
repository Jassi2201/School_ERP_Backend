const router = require('express').Router();
const controller = require('./controller');

// Admin CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Student views
router.get('/student/:studentId/today', controller.getStudentToday);
router.get('/student/:studentId/week', controller.getStudentWeek);

// Teacher views
router.get('/teacher/:teacherId/today', controller.getTeacherToday);
router.get('/teacher/:teacherId/week', controller.getTeacherWeek);

module.exports = router;