const { PrismaClient } = require('@prisma/client');
const { calcularSaldo } = require('../utils/timeConverter');
const excelService = require('../services/excelService');
const prisma = require('../lib/prisma');


// Función para generar un resumen del uso de permisos por maestro para un año escolar específico. Devuelve el maestro junto con el saldo utilizado y disponible para permisos por enfermedad y personales.
async function resumenMaestros(req, res) {
  try {
    const { anoEscolarId } = req.query;
    if (!anoEscolarId) return res.status(400).json({ error: 'anoEscolarId requerido' });

    const registros = await prisma.maestroAno.findMany({
      where:   { anoEscolarId },
      include: { maestro: true },
    });

    const resumen = registros.map((r) => ({
      maestro:    r.maestro,
      enfermedad: calcularSaldo('ENFERMEDAD', r.enfMinUsados),
      personal:   calcularSaldo('PERSONAL',   r.persMinUsados),
    }));
    res.json(resumen);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Función para exportar el reporte de permisos a Excel. Recibe el año escolar y el mes como parámetros de consulta, genera el reporte utilizando el servicio de Excel y lo envía como una descarga al cliente.
async function exportarExcel(req, res) {
  try {
    const { anoEscolarId, mes } = req.query;
    const buffer = await excelService.generarReporte(anoEscolarId, mes);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_permisos_${mes || 'completo'}.xlsx"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { resumenMaestros, exportarExcel };