const { obtenerSaldo } = require('../services/saldoService');
const prisma = require('../lib/prisma');

async function listar(req, res) {
  try {
    const { anoEscolarId, busqueda, pagina = 1, limite = 20, incluirInactivos } = req.query;
    const skip = (Number(pagina) - 1) * Number(limite);

    const where = {};
    if (!incluirInactivos || incluirInactivos === 'false') {
      where.activo = true;
    }

    if (busqueda) {
      where.OR = [
        { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
        { nipEscalafon:   { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const [maestros, total] = await Promise.all([
      prisma.maestro.findMany({
        where,
        orderBy: { nombreCompleto: 'asc' },
        skip,
        take: Number(limite),
      }),
      prisma.maestro.count({ where }),
    ]);

    let resultado = maestros;
    if (anoEscolarId) {
      resultado = await Promise.all(
        maestros.map(async (m) => ({
          ...m,
          saldo: await obtenerSaldo(m.id, anoEscolarId),
        }))
      );
    }

    res.json({ data: resultado, total, pagina: Number(pagina), totalPaginas: Math.ceil(total / Number(limite)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function crear(req, res) {
  try {
    const maestro = await prisma.maestro.create({ data: req.body });
    res.status(201).json(maestro);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function obtener(req, res) {
  try {
    const { anoEscolarId } = req.query;
    const maestro = await prisma.maestro.findUnique({ where: { id: req.params.id } });
    if (!maestro) return res.status(404).json({ error: 'Maestro no encontrado' });

    if (anoEscolarId) {
      const saldo = await obtenerSaldo(maestro.id, anoEscolarId);
      return res.json({ ...maestro, saldo });
    }
    res.json(maestro);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function actualizar(req, res) {
  try {
    const { nipEscalafon, nombreCompleto, tipoContratacion } = req.body;
    const maestro = await prisma.maestro.update({
      where: { id: req.params.id },
      data:  { nipEscalafon, nombreCompleto, tipoContratacion },
    });
    res.json(maestro);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function desactivar(req, res) {
  try {
    const maestro = await prisma.maestro.update({
      where: { id: req.params.id },
      data:  { activo: false },
    });
    res.json({ 
      mensaje: 'Maestro desactivado correctamente. Sus permisos históricos se conservan.', 
      maestro 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function reactivar(req, res) {
  try {
    const maestro = await prisma.maestro.update({
      where: { id: req.params.id },
      data:  { activo: true },
    });
    res.json({ 
      mensaje: 'Maestro reactivado correctamente.', 
      maestro 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function eliminarPermanente(req, res) {
  try {
    const maestro = await prisma.maestro.findUnique({ 
      where: { id: req.params.id },
      include: { anos: true, permisos: true }
    });
    
    if (!maestro) return res.status(404).json({ error: 'Maestro no encontrado' });
    if (maestro.activo) return res.status(400).json({ error: 'No puedes eliminar un maestro activo. Desactívalo primero.' });
    
    const updatedAt = new Date(maestro.updatedAt);
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    if (updatedAt > tresMesesAtras) {
      return res.status(400).json({ 
        error: 'Deben pasar 3 meses de inactividad para poder eliminar permanentemente.' 
      });
    }

    await prisma.$transaction([
      prisma.maestroAno.deleteMany({ where: { maestroId: req.params.id } }),
      prisma.permiso.deleteMany({ where: { maestroId: req.params.id } }),
      prisma.maestro.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ mensaje: 'Maestro eliminado permanentemente junto con todos sus registros.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ✅ EXPORTAR TODO — esto es lo que debe coincidir con ctrl.* en la ruta
module.exports = { 
  listar, 
  crear, 
  obtener, 
  actualizar, 
  desactivar, 
  reactivar, 
  eliminarPermanente 
};