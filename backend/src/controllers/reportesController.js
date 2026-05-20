const { calcularSaldo } = require('../utils/timeConverter');
const excelService = require('../services/excelService');
const prisma = require('../lib/prisma');

async function anoActivo(req, res) {
  try {
    const ano = await prisma.anoEscolar.findFirst({ where: { activo: true }, orderBy: { anio: 'desc' } });
    if (!ano) return res.status(404).json({ error: 'No hay año escolar activo' });
    res.json(ano);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Reporte por mes: todos los maestros que tuvieron permisos en ese mes
async function resumenPorMes(req, res) {
  try {
    const { anoEscolarId, mes } = req.query;
    if (!anoEscolarId || !mes) return res.status(400).json({ error: 'anoEscolarId y mes son requeridos' });

    const [anio, mesNum] = mes.split('-').map(Number);
    const inicio = new Date(Date.UTC(anio, mesNum - 1, 1));
    const fin    = new Date(Date.UTC(anio, mesNum, 0, 23, 59, 59));

    const permisos = await prisma.permiso.findMany({
      where: { anoEscolarId, fechaInicio: { gte: inicio, lte: fin } },
      include: { maestro: true },
      orderBy: [{ maestro: { nombreCompleto: 'asc' } }, { fechaInicio: 'asc' }],
    });

    // Agrupar por maestro
    const porMaestro = {};
    for (const p of permisos) {
      const key = p.maestroId;
      if (!porMaestro[key]) {
        const saldoReg = await prisma.maestroAno.findUnique({
          where: { maestroId_anoEscolarId: { maestroId: p.maestroId, anoEscolarId } },
        });
        porMaestro[key] = {
          maestro:   p.maestro,
          permisos:  [],
          saldo: {
            enfermedad: calcularSaldo('ENFERMEDAD', saldoReg?.enfMinUsados || 0),
            personal:   calcularSaldo('PERSONAL',   saldoReg?.persMinUsados || 0),
          },
        };
      }
      porMaestro[key].permisos.push(p);
    }

    res.json(Object.values(porMaestro));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Reporte por maestro: todos los meses con permisos de ese maestro
async function resumenPorMaestro(req, res) {
  try {
    const { anoEscolarId, maestroId } = req.query;
    if (!anoEscolarId || !maestroId) return res.status(400).json({ error: 'anoEscolarId y maestroId son requeridos' });

    const [maestro, permisos, saldoReg] = await Promise.all([
      prisma.maestro.findUnique({ where: { id: maestroId } }),
      prisma.permiso.findMany({
        where: { maestroId, anoEscolarId },
        orderBy: { fechaInicio: 'asc' },
      }),
      prisma.maestroAno.findUnique({
        where: { maestroId_anoEscolarId: { maestroId, anoEscolarId } },
      }),
    ]);

    // Agrupar por mes
    const porMes = {};
    for (const p of permisos) {
      const key = p.fechaInicio.toISOString().slice(0, 7); // "2026-01"
      if (!porMes[key]) porMes[key] = [];
      porMes[key].push(p);
    }

    res.json({
      maestro,
      saldo: {
        enfermedad: calcularSaldo('ENFERMEDAD', saldoReg?.enfMinUsados || 0),
        personal:   calcularSaldo('PERSONAL',   saldoReg?.persMinUsados || 0),
      },
      meses: porMes,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function exportarExcel(req, res) {
  try {
    const { anoEscolarId, mes, maestroId } = req.query;
    const buffer   = await excelService.generarReporte(anoEscolarId, mes, maestroId);
    const nombre   = mes ? `permisos_${mes}.xlsx` : maestroId ? `permisos_maestro.xlsx` : `permisos_completo.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { anoActivo, resumenPorMes, resumenPorMaestro, exportarExcel };