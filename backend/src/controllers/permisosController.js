const { toMinutos } = require('../utils/timeConverter');
const { descontarSaldo } = require('../services/saldoService');
const prisma = require('../lib/prisma');

async function listar(req, res) {
  try {
    const { maestroId, anoEscolarId, mes, tipo, pagina = 1, limite = 10 } = req.query;
    const skip = (Number(pagina) - 1) * Number(limite);

    const where = {};
    if (maestroId)    where.maestroId    = maestroId;
    if (anoEscolarId) where.anoEscolarId = anoEscolarId;
    if (tipo)         where.tipo         = tipo;
    if (mes) {
      // Usar UTC para evitar desfase de zona horaria
      const [anio, mesNum] = mes.split('-').map(Number);
      where.fechaInicio = {
        gte: new Date(Date.UTC(anio, mesNum - 1, 1)),
        lte: new Date(Date.UTC(anio, mesNum, 0, 23, 59, 59)),
      };
    }

    const [permisos, total] = await Promise.all([
      prisma.permiso.findMany({
        where,
        include: { maestro: true },
        orderBy: { fechaInicio: 'desc' },
        skip,
        take: Number(limite),
      }),
      prisma.permiso.count({ where }),
    ]);

    res.json({
      data:       permisos,
      total,
      pagina:     Number(pagina),
      totalPaginas: Math.ceil(total / Number(limite)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function crear(req, res) {
  try {
    const { maestroId, anoEscolarId, tipo, fechaInicio, fechaFin, dias, horas, minutos, observacion } = req.body;

    const totalMinutos = toMinutos(Number(dias) || 0, Number(horas) || 0, Number(minutos) || 0);
    if (totalMinutos === 0) return res.status(400).json({ error: 'Debes ingresar al menos 1 minuto de permiso' });

    // Descontar del saldo — lanza error si no alcanza
    await descontarSaldo(maestroId, anoEscolarId, tipo, Number(dias) || 0, Number(horas) || 0, Number(minutos) || 0);

    const permiso = await prisma.permiso.create({
      data: {
        maestroId, anoEscolarId, tipo,
        fechaInicio:  new Date(fechaInicio),
        fechaFin:     new Date(fechaFin),
        dias:         Number(dias)    || 0,
        horas:        Number(horas)   || 0,
        minutos:      Number(minutos) || 0,
        totalMinutos,
        observacion:  observacion || null,
        creadoPor:    req.usuario.email,
      },
      include: { maestro: true },
    });
    res.status(201).json(permiso);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function eliminar(req, res) {
  try {
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