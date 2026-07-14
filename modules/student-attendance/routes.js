const router = require('express').Router();
const controller = require('./controller');

// ✅ Static routes must come before dynamic routes
router.get('/dashboard', controller.getStudentAttendanceDashboard);
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;