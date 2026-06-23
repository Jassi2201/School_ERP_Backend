const router = require('express').Router();
const controller = require('./controller');
const upload = require('../../middleware/upload');

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', upload.single('profile_picture'), controller.create);
router.put('/:id', upload.single('profile_picture'), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;