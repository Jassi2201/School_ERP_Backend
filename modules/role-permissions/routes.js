const router = require('express').Router();
const controller = require('./controller');

router.get('/roles', controller.getRoles);
router.get('/role/:roleId', controller.getRolePermissions);
router.put('/role/:roleId', controller.updateRolePermissions);

module.exports = router;