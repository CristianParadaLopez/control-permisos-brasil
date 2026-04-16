const { PrismaClient } = require('@prisma/client');
const { obtenerSaldo } = require('../services/saldoService');
const prisma = require('../lib/prisma');


// Función para listar maestros. Si se proporciona el parámetro anoEscolarId, también adjunta el saldo de permisos de cada maestro para ese año escolar.
async function listar(req, res) {
  try {
    const { anoEscolarId } = req.query;
    const maestros = await prisma.maestro.findMany({
      where:   { activo: true },
      orderBy: { nombreCompleto: 'asc' },
    });
    // Si viene anoEscolarId, adjuntar saldo de cada maestro
    if (anoEscolarId) {
      const conSaldo = await Promise.all(
        maestros.map(async (m) => ({
          ...m,
          saldo: await obtenerSaldo(m.id, anoEscolarId),
        }))
      );
      return res.json(conSaldo);
    }
    res.json(maestros);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Función para crear un nuevo maestro. Recibe los datos del maestro en el cuerpo de la solicitud y lo guarda en la base de datos.
async function crear(req, res) {
  try {
    const maestro = await prisma.maestro.create({ data: req.body });
    res.status(201).json(maestro);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Función para obtener un maestro por su ID. Si el maestro no existe, devuelve un error 404.
async function obtener(req, res) {
  try {
    const maestro = await prisma.maestro.findUnique({
      where: { id: req.params.id },
    });
    if (!maestro) return res.status(404).json({ error: 'Maestro no encontrado' });
    res.json(maestro);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Función para actualizar un maestro existente. Recibe los datos actualizados en el cuerpo de la solicitud y el ID del maestro en los parámetros de la ruta.
async function actualizar(req, res) {
  try {
    const maestro = await prisma.maestro.update({
      where: { id: req.params.id },
      data:  req.body,
    });
    res.json(maestro);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { listar, crear, obtener, actualizar };