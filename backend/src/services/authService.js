/* Este servicio maneja la lógica de autenticación, incluyendo el registro de nuevos usuarios y el inicio de sesión. 
Utiliza bcrypt para el hashing de contraseñas y jsonwebtoken para la generación de tokens JWT
que se utilizan para autenticar a los usuarios en las rutas protegidas. */
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma = require('../lib/prisma');
/* Función para registrar un nuevo usuario. Verifica si el email ya está registrado, hashea la contraseña 
y crea el usuario en la base de datos. Luego genera un token JWT para el nuevo usuario. */
async function registrar({ email, password, nombre, rol }) {
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) throw new Error('El email ya está registrado');

  const hash    = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { email, password: hash, nombre, rol },
  });
  return _generarToken(usuario);
}

// Función para iniciar sesión. Verifica las credenciales del usuario y, si son correctas, genera un token JWT.
async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) throw new Error('Credenciales incorrectas');

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido)  throw new Error('Credenciales incorrectas');

  return _generarToken(usuario);
}

/* Función interna para generar un token JWT con la información del usuario. El token incluye el ID, email, 
rol y nombre del usuario, y tiene una expiración definida en las variables de entorno. */
function _generarToken(usuario) {
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return { token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol } };
}

module.exports = { registrar, login };