const app  = require('./app');
const PORT = process.env.PORT || 3001;

// Inicia el servidor en el puerto especificado y muestra un mensaje en la consola indicando que el servidor está corriendo y en qué URL se puede acceder a él.
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});