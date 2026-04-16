const router              = require('express').Router();
const ctrl                = require('../controllers/maestrosController');
const { authMiddleware }  = require('../middlewares/authMiddleware');

router.use(authMiddleware); // todas las rutas requieren login

router.get('/',      ctrl.listar);
router.post('/',     ctrl.crear);
router.get('/:id',   ctrl.obtener);
router.put('/:id',   ctrl.actualizar);

module.exports = router;