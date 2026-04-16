// Rutas de autenticación para el backend. Define las rutas para registrar un nuevo usuario, iniciar sesión y obtener el perfil del usuario autenticado.
const router              = require('express').Router();
const authController      = require('../controllers/authController');
const { authMiddleware }  = require('../middlewares/authMiddleware');

// Rutas de autenticación: registro, login y perfil (protegida por authMiddleware)
router.post('/registrar', authController.registrar);
router.post('/login',     authController.login);
router.get('/perfil',     authMiddleware, authController.perfil);

module.exports = router;