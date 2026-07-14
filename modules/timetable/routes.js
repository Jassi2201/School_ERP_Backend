const router = require('express').Router();
const controller = require('./controller');

// Admin CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/student/my-classes', controller.getMyClasses);



module.exports = router;