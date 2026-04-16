const { PrismaClient } = require('@prisma/client');
const { toMinutos }    = require('../utils/timeConverter');
const { descontarSaldo, obtenerSaldo } = require('../services/saldoService');
const prisma = require('../lib/prisma');


// Función para listar permisos. Permite filtrar por maestro, año escolar y mes. Devuelve los permisos junto con la información del maestro.
async function listar(req, res) {
  try {
    const { maestroId, anoEscolarId, mes } = req.query;
    const where = {};
    if (maestroId)    where.maestroId    = maestroId;
    if (anoEscolarId) where.anoEscolarId = anoEscolarId;
    if (mes) {
      const inicio = new Date(mes + '-01');
      const fin    = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
      where.fechaInicio = { gte: inicio, lte: fin };
    }
    // Recuperar permisos con filtros y datos del maestro
    const permisos = await prisma.permiso.findMany({
      where,
      include: { maestro: true },
      orderBy: { fechaInicio: 'desc' },
    });
    res.json(permisos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Función para crear un nuevo permiso. Recibe los datos del permiso en el cuerpo de la solicitud, calcula el total en minutos, descuenta del saldo del maestro y guarda el permiso en la base de datos.
async function crear(req, res) {
  try {
    const { maestroId, anoEscolarId, tipo, fechaInicio, fechaFin, dias, horas, minutos, observacion } = req.body;

    // Calcular total en minutos
    const totalMinutos = toMinutos(dias, horas, minutos);
    if (totalMinutos === 0) return res.status(400).json({ error: 'Debes ingresar al menos un minuto de permiso' });

    // Descontar del saldo (lanza error si no hay saldo)
    await descontarSaldo(maestroId, anoEscolarId, tipo, dias, horas, minutos);

    // Crear el permiso en la base de datos
    const permiso = await prisma.permiso.create({
      data: {
        maestroId, anoEscolarId, tipo,
        fechaInicio: new Date(fechaInicio),
        fechaFin:    new Date(fechaFin),
        dias:    Number(dias)    || 0,
        horas:   Number(horas)   || 0,
        minutos: Number(minutos) || 0,
        totalMinutos,
        observacion,
        creadoPor: req.usuario.email,
      },
      include: { maestro: true },
    });
    res.status(201).json(permiso);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Función para eliminar un permiso. Recupera el permiso para devolver el saldo al maestro, luego elimina el permiso de la base de datos.
async function eliminar(req, res) {
  try {
    // Recuperar el permiso para devolver el saldo
    const permiso = await prisma.permiso.findUnique({ where: { id: req.params.id } });
    if (!permiso) return res.status(404).json({ error: 'Permiso no encontrado' });

    const campo = permiso.tipo === 'ENFERMEDAD' ? 'enfMinUsados' : 'persMinUsados';
    await prisma.maestroAno.update({
      where: { maestroId_anoEscolarId: { maestroId: permiso.maestroId, anoEscolarId: permiso.anoEscolarId } },
      data:  { [campo]: { decrement: permiso.totalMinutos } },
    });
    await prisma.permiso.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Permiso eliminado y saldo restaurado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { listar, crear, eliminar };