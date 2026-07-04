const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

module.exports = router;