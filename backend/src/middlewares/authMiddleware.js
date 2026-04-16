// Este middleware verifica la presencia y validez de un token JWT en las solicitudes entrantes. Si el token es válido, se adjunta la información del usuario al objeto `req` para su uso en rutas protegidas. También incluye una función adicional `soloAdmin` para restringir el acceso a ciertas rutas solo a usuarios con rol de administrador.
const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT y proteger rutas
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  // Extrae el token del encabezado "Authorization" y verifica su validez
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware para restringir acceso solo a administradores
function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
}

// Exporta los middlewares para su uso en otras partes de la aplicación
module.exports = { authMiddleware, soloAdmin };