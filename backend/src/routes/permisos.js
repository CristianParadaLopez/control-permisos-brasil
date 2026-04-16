const router             = require('express').Router();
const ctrl               = require('../controllers/permisosController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/',      ctrl.listar);
router.post('/',     ctrl.crear);
router.delete('/:id', ctrl.eliminar);

module.exports = router;