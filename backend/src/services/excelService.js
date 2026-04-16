const ExcelJS            = require('exceljs');
const { PrismaClient }   = require('@prisma/client');
const { fromfromMinutos, calcularSaldo } = require('../utils/timeConverter');
const prisma = require('../lib/prisma');


// Función para generar un reporte de permisos en formato Excel. Permite filtrar por año escolar y mes. El reporte incluye información del maestro, tipo de permiso, fechas, duración, saldo restante y observaciones.
async function generarReporte(anoEscolarId, mes) {
  const where = { anoEscolarId };
  if (mes) {
    const inicio = new Date(mes + '-01');
    const fin    = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
    where.fechaInicio = { gte: inicio, lte: fin };
  }

  // Recuperar permisos con filtros y datos del maestro
  const permisos = await prisma.permiso.findMany({
    where,
    include: { maestro: true },
    orderBy: { fechaInicio: 'asc' },
  });

  // Recuperar año escolar para el título del reporte
  const ano = await prisma.anoEscolar.findUnique({ where: { id: anoEscolarId } });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte Permisos');

  // Encabezado igual al formato del MINED
  ws.mergeCells('A1:S1');
  ws.getCell('A1').value = 'COMPLEJO EDUCATIVO REPUBLICA DEL BRASIL';
  ws.getCell('A1').font  = { bold: true, size: 14 };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:S2');
  ws.getCell('A2').value = `Infraestructura: 11661`;
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.mergeCells('A3:S3');
  ws.getCell('A3').value = `Reporte de permisos de personal docente — Año ${ano?.anio || ''}`;
  ws.getCell('A3').alignment = { horizontal: 'center' };

  // Cabeceras
  const headers = [
    'NIP/Escalafón', 'Nombre completo', 'Tipo contratación',
    'Fecha inicio', 'Fecha fin',
    'Enf. Días', 'Enf. Horas', 'Enf. Min.',
    'Saldo Enf. Días', 'Saldo Enf. Horas', 'Saldo Enf. Min.',
    'Pers. Días', 'Pers. Horas', 'Pers. Min.',
    'Saldo Pers. Días', 'Saldo Pers. Horas', 'Saldo Pers. Min.',
    'Observación', 'Registrado por',
  ];
  const headerRow = ws.addRow(headers);
  headerRow.font  = { bold: true };
  headerRow.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };

  // Datos
  for (const p of permisos) {
    const saldoAno = await prisma.maestroAno.findUnique({
      where: { maestroId_anoEscolarId: { maestroId: p.maestroId, anoEscolarId } },
    });
    const saldoEnf  = calcularSaldo('ENFERMEDAD', saldoAno?.enfMinUsados  || 0).disponible;
    const saldoPers = calcularSaldo('PERSONAL',   saldoAno?.persMinUsados || 0).disponible;

    // Agregar fila por cada permiso, mostrando datos del maestro, tipo de permiso, fechas, duración, saldo restante y observaciones
    ws.addRow([
      p.maestro.nipEscalafon,
      p.maestro.nombreCompleto,
      p.maestro.tipoContratacion,
      p.fechaInicio.toLocaleDateString('es-SV'),
      p.fechaFin.toLocaleDateString('es-SV'),
      p.tipo === 'ENFERMEDAD' ? p.dias    : '',
      p.tipo === 'ENFERMEDAD' ? p.horas   : '',
      p.tipo === 'ENFERMEDAD' ? p.minutos : '',
      p.tipo === 'ENFERMEDAD' ? saldoEnf.dias    : '',
      p.tipo === 'ENFERMEDAD' ? saldoEnf.horas   : '',
      p.tipo === 'ENFERMEDAD' ? saldoEnf.minutos : '',
      p.tipo === 'PERSONAL' ? p.dias    : '',
      p.tipo === 'PERSONAL' ? p.horas   : '',
      p.tipo === 'PERSONAL' ? p.minutos : '',
      p.tipo === 'PERSONAL' ? saldoPers.dias    : '',
      p.tipo === 'PERSONAL' ? saldoPers.horas   : '',
      p.tipo === 'PERSONAL' ? saldoPers.minutos : '',
      p.observacion || '',
      p.creadoPor,
    ]);
  }

  // Ajustar ancho de columnas
  ws.columns.forEach((col) => { col.width = 18; });
  return wb.xlsx.writeBuffer();
}

module.exports = { generarReporte };