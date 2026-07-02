const router = require('express').Router();
const controller = require('./controller');
const upload = require('../../middleware/upload'); // ✅ using your existing upload.js

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', upload.single('file'), controller.create);
router.put('/:id', upload.single('file'), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;