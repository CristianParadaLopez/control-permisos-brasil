const router             = require('express').Router();
const ctrl               = require('../controllers/reportesController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/resumen', ctrl.resumenMaestros);
router.get('/excel',   ctrl.exportarExcel);
router.get('/ano-activo', ctrl.anoActivo);
module.exports = router;