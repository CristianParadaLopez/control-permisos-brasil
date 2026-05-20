const router             = require('express').Router();
const ctrl               = require('../controllers/maestrosController'); // ← nombre exacto del archivo
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/',                 ctrl.listar);
router.post('/',                ctrl.crear);
router.get('/:id',              ctrl.obtener);
router.put('/:id',              ctrl.actualizar);
router.patch('/:id/desactivar', ctrl.desactivar);
router.patch('/:id/reactivar',  ctrl.reactivar);
router.delete('/:id',           ctrl.eliminarPermanente);

module.exports = router;