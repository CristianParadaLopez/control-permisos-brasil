const authService = require('../services/authService');

/* Función para registrar un nuevo usuario. Verifica si el email ya está registrado, hashea la contraseña
 y crea el usuario en la base de datos. Luego genera un token JWT para el nuevo usuario. */
async function registrar(req, res) {
  try {
    const datos = await authService.registrar(req.body);
    res.status(201).json(datos);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Función para iniciar sesión. Verifica las credenciales del usuario y, si son correctas, genera un token JWT.
async function login(req, res) {
  try {
    const datos = await authService.login(req.body);
    res.json(datos);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
}

// Función para obtener el perfil del usuario autenticado. Devuelve la información del usuario extraída del token JWT.
async function perfil(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { registrar, login, perfil };