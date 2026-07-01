const router = require('express').Router();
const controller = require('./controller');

// Classes
router.get('/classes', controller.getAllClasses);
router.post('/classes', controller.createClass);
router.put('/classes/:id', controller.updateClass);
router.delete('/classes/:id', controller.deleteClass);

// Sections
router.get('/classes/:classId/sections', controller.getSectionsByClass);
router.post('/sections', controller.createSection);
router.put('/sections/:id', controller.updateSection);
router.delete('/sections/:id', controller.deleteSection);

module.exports = router;