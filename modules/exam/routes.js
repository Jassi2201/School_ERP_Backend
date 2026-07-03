const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getExams);
router.get('/:id', controller.getExam);
router.post('/', controller.createExam);
router.put('/:id', controller.updateExam);
router.delete('/:id', controller.deleteExam);

module.exports = router;