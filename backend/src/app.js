const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Configurar CORS para permitir solicitudes desde el frontend. La URL del frontend se define en las variables de entorno.
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/maestros', require('./routes/maestros'));
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/reportes', require('./routes/reportes'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

module.exports = app;