const router = require('express').Router();
const controller = require('./controller');
const upload = require('../../middleware/upload');

// Homework CRUD
router.get('/', controller.getAllHomework);
router.get('/:id', controller.getHomework);
router.post('/', upload.single('attachment'), controller.createHomework);
router.put('/:id', upload.single('attachment'), controller.updateHomework);
router.delete('/:id', controller.deleteHomework);

// Submissions
router.get('/:homeworkId/submissions', controller.getSubmissions);
router.post('/:homeworkId/submit', upload.single('attachment'), controller.submitHomework);
router.put('/submissions/:submissionId', controller.evaluateSubmission);

module.exports = router;