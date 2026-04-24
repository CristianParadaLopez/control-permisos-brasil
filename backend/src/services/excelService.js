const ExcelJS          = require('exceljs');
const { calcularSaldo } = require('../utils/timeConverter');
const prisma           = require('../lib/prisma');

async function generarReporte(anoEscolarId, mes) {
  const where = { anoEscolarId };
  if (mes) {
    const inicio = new Date(mes + '-01');
    const fin    = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
    where.fechaInicio = { gte: inicio, lte: fin };
  }

  const permisos = await prisma.permiso.findMany({
    where,
    include: { maestro: true },
    orderBy: { fechaInicio: 'asc' },
  });

  const ano = await prisma.anoEscolar.findUnique({ where: { id: anoEscolarId } });

  // Agrupar permisos por maestro
  const porMaestro = {};
  for (const p of permisos) {
    if (!porMaestro[p.maestroId]) {
      porMaestro[p.maestroId] = { maestro: p.maestro, permisos: [] };
    }
    porMaestro[p.maestroId].permisos.push(p);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Control de Permisos');

  // ── Colores institucionales ──
  const VERDE      = 'FF70AD47';
  const VERDE_CLARO= 'FFE2EFDA';
  const AZUL       = 'FF4472C4';
  const GRIS       = 'FFD9D9D9';
  const AMARILLO   = 'FFFFC000';
  const BORDE = {
    top:    { style: 'thin' },
    left:   { style: 'thin' },
    bottom: { style: 'thin' },
    right:  { style: 'thin' },
  };

  // ── Fila 1: Título institucional ──
  ws.mergeCells('A1:S1');
  const t1 = ws.getCell('A1');
  t1.value = 'COMPLEJO EDUCATIVO REPÚBLICA DE BRASIL';
  t1.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  t1.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
  t1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 22;

  // ── Fila 2: Subtítulo ──
  ws.mergeCells('A2:S2');
  const t2 = ws.getCell('A2');
  t2.value = `CONTROL DE PERMISOS DEL PERSONAL DOCENTE — AÑO ESCOLAR ${ano?.anio || new Date().getFullYear()}`;
  t2.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  t2.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
  t2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  // ── Fila 3: Encabezados grupo nivel 1 ──
  // Col A: NIP, B: Nombre, C: Tipo contratación (3 sub), F: Fecha (2 sub),
  // H: Enfermedad (3 sub), K: Saldo Enf (3 sub), N: Personal (3 sub), Q: Saldo Pers (3 sub)
  const styleHeader = (cell, value, color = VERDE) => {
    cell.value = value;
    cell.font  = { bold: true, size: 9, color: { argb: 'FF000000' } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDE;
  };

  // Fila 3 — grupos
  ws.mergeCells('A3:A4'); styleHeader(ws.getCell('A3'), 'NIP o\nEscalafón', GRIS);
  ws.mergeCells('B3:B4'); styleHeader(ws.getCell('B3'), 'Nombre completo', GRIS);
  ws.mergeCells('C3:E3'); styleHeader(ws.getCell('C3'), 'Tipo de contratación', GRIS);
  ws.mergeCells('F3:G3'); styleHeader(ws.getCell('F3'), 'Fecha', GRIS);
  ws.mergeCells('H3:J3'); styleHeader(ws.getCell('H3'), 'Enfermedad con Certificado Médico\n(90 días)', VERDE);
  ws.mergeCells('K3:M3'); styleHeader(ws.getCell('K3'), 'Saldo disponible\nEnfermedad', VERDE_CLARO);
  ws.mergeCells('N3:P3'); styleHeader(ws.getCell('N3'), 'Motivos Personales\n(5 días)', AMARILLO);
  ws.mergeCells('Q3:S3'); styleHeader(ws.getCell('Q3'), 'Saldo disponible\nPersonales', 'FFFFF2CC');

  ws.getRow(3).height = 30;

  // Fila 4 — subencabezados
  styleHeader(ws.getCell('C4'), 'Sueldo Base', GRIS);
  styleHeader(ws.getCell('D4'), 'Sobre Sueldo', GRIS);
  styleHeader(ws.getCell('E4'), 'Horas Clase', GRIS);
  styleHeader(ws.getCell('F4'), 'Inicia', GRIS);
  styleHeader(ws.getCell('G4'), 'Finaliza', GRIS);
  styleHeader(ws.getCell('H4'), 'Día', VERDE);
  styleHeader(ws.getCell('I4'), 'Hora', VERDE);
  styleHeader(ws.getCell('J4'), 'Min.', VERDE);
  styleHeader(ws.getCell('K4'), 'Día', VERDE_CLARO);
  styleHeader(ws.getCell('L4'), 'Hora', VERDE_CLARO);
  styleHeader(ws.getCell('M4'), 'Min.', VERDE_CLARO);
  styleHeader(ws.getCell('N4'), 'Día', AMARILLO);
  styleHeader(ws.getCell('O4'), 'Hora', AMARILLO);
  styleHeader(ws.getCell('P4'), 'Min.', AMARILLO);
  styleHeader(ws.getCell('Q4'), 'Día', 'FFFFF2CC');
  styleHeader(ws.getCell('R4'), 'Hora', 'FFFFF2CC');
  styleHeader(ws.getCell('S4'), 'Min.', 'FFFFF2CC');

  ws.getRow(4).height = 18;

  // ── Filas de datos ──
  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-SV') : '';
  let rowNum = 5;

  for (const { maestro, permisos: mPermisos } of Object.values(porMaestro)) {
    const saldoAno = await prisma.maestroAno.findUnique({
      where: { maestroId_anoEscolarId: { maestroId: maestro.id, anoEscolarId } },
    });
    const saldoEnf  = calcularSaldo('ENFERMEDAD', saldoAno?.enfMinUsados  || 0).disponible;
    const saldoPers = calcularSaldo('PERSONAL',   saldoAno?.persMinUsados || 0).disponible;

    for (const p of mPermisos) {
      const row = ws.getRow(rowNum);
      const isEnf = p.tipo === 'ENFERMEDAD';

      const datos = [
        maestro.nipEscalafon,                          // A
        maestro.nombreCompleto,                        // B
        maestro.tipoContratacion === 'Sueldo Base'  ? '✓' : '', // C
        maestro.tipoContratacion === 'Sobre Sueldo' ? '✓' : '', // D
        maestro.tipoContratacion === 'Horas Clase'  ? '✓' : '', // E
        fmt(p.fechaInicio),                            // F
        fmt(p.fechaFin),                               // G
        isEnf ? p.dias    : '',                        // H
        isEnf ? p.horas   : '',                        // I
        isEnf ? p.minutos : '',                        // J
        isEnf ? saldoEnf.dias    : '',                 // K
        isEnf ? saldoEnf.horas   : '',                 // L
        isEnf ? saldoEnf.minutos : '',                 // M
        !isEnf ? p.dias    : '',                       // N
        !isEnf ? p.horas   : '',                       // O
        !isEnf ? p.minutos : '',                       // P
        !isEnf ? saldoPers.dias    : '',               // Q
        !isEnf ? saldoPers.horas   : '',               // R
        !isEnf ? saldoPers.minutos : '',               // S
      ];

      datos.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.border = BORDE;
        cell.alignment = { horizontal: i < 2 ? 'left' : 'center', vertical: 'middle' };
        cell.font = { size: 9 };
        if (rowNum % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        }
      });

      row.height = 16;
      rowNum++;
    }
  }

  // ── Fila de firma ──
  rowNum += 2;
  ws.mergeCells(`A${rowNum}:S${rowNum}`);
  ws.getCell(`A${rowNum}`).value = 'F_______________________________________';
  ws.getCell(`A${rowNum}`).alignment = { horizontal: 'left' };
  rowNum++;
  ws.mergeCells(`A${rowNum}:S${rowNum}`);
  ws.getCell(`A${rowNum}`).value = 'Nombre: Lic. Francisco Gerber Ramírez Ardona';
  ws.getCell(`A${rowNum}`).font  = { bold: true, size: 10 };
  rowNum++;
  ws.mergeCells(`A${rowNum}:S${rowNum}`);
  ws.getCell(`A${rowNum}`).value = 'Director de Centro Educativo';
  ws.getCell(`A${rowNum}`).font  = { size: 10 };

  // ── Anchos de columna ──
  ws.getColumn('A').width = 12;
  ws.getColumn('B').width = 30;
  ws.getColumn('C').width = 11;
  ws.getColumn('D').width = 11;
  ws.getColumn('E').width = 11;
  ws.getColumn('F').width = 11;
  ws.getColumn('G').width = 11;
  ['H','I','J','K','L','M','N','O','P','Q','R','S'].forEach(c => {
    ws.getColumn(c).width = 7;
  });

  return wb.xlsx.writeBuffer();
}

module.exports = { generarReporte };