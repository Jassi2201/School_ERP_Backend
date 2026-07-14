const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getAll);
router.get('/my-transport', controller.getMyTransport); 
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;