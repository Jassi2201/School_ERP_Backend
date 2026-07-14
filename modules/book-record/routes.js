const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getAll);
router.get('/my-books', controller.getMyBooks);     
router.get('/:id', controller.getOne);
router.post('/:id/return', controller.returnBook);
router.delete('/:id', controller.delete);


module.exports = router;