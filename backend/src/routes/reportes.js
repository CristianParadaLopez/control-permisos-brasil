const router             = require('express').Router();
const ctrl               = require('../controllers/reportesController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/ano-activo',     ctrl.anoActivo);
router.get('/por-mes',        ctrl.resumenPorMes);
router.get('/por-maestro',    ctrl.resumenPorMaestro);
router.get('/excel',          ctrl.exportarExcel);

module.exports = router;