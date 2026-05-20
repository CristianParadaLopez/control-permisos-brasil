const ExcelJS          = require('exceljs');
const path             = require('path');
const prisma           = require('../lib/prisma');
const { fromMinutos, calcularSaldo } = require('../utils/timeConverter');

const VERDE  = 'FF248842';
const AMARI  = 'FFFAD327';
const MARRON = 'FF7A3F25';
const BLANCO = 'FFFFFFFF';
const VERDE_CLARO = 'FFD6EDDB';

async function generarReporte(anoEscolarId, mes, maestroId) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Control Permisos';

  const ano = await prisma.anoEscolar.findUnique({ where: { id: anoEscolarId } });

  // ✅ CORREGIDO: Construir where con soporte para maestroId
  const where = { anoEscolarId };
  if (maestroId) where.maestroId = maestroId;
  if (mes) {
    const [anio, mesNum] = mes.split('-').map(Number);
    where.fechaInicio = {
      gte: new Date(Date.UTC(anio, mesNum - 1, 1)),
      lte: new Date(Date.UTC(anio, mesNum, 0, 23, 59, 59)),
    };
  }

  const permisos = await prisma.permiso.findMany({
    where,
    include: { maestro: true },
    orderBy: [{ maestro: { nombreCompleto: 'asc' } }, { fechaInicio: 'asc' }],
  });

  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  
  // ✅ CORREGIDO: Título dinámico según filtro
  let mesTitulo;
  if (mes) {
    mesTitulo = MESES_ES[Number(mes.split('-')[1]) - 1] + ' ' + mes.split('-')[0];
  } else if (maestroId) {
    const m = await prisma.maestro.findUnique({ where: { id: maestroId } });
    mesTitulo = `Maestro: ${m?.nombreCompleto || 'Desconocido'} — Año ${ano?.anio || new Date().getFullYear()}`;
  } else {
    mesTitulo = String(ano?.anio || new Date().getFullYear());
  }

  const ws = wb.addWorksheet('Reporte Permisos', { 
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 } 
  });

  // ── Columnas ──
  ws.columns = [
    { key: 'nip',     width: 14 },
    { key: 'nombre',  width: 32 },
    { key: 'tipo',    width: 14 },
    { key: 'inicio',  width: 14 },
    { key: 'fin',     width: 14 },
    { key: 'eDias',   width: 8 },
    { key: 'eHoras',  width: 8 },
    { key: 'eMins',   width: 8 },
    { key: 'eSalDia', width: 10 },
    { key: 'eSalHor', width: 10 },
    { key: 'eSalMin', width: 10 },
    { key: 'pDias',   width: 8 },
    { key: 'pHoras',  width: 8 },
    { key: 'pMins',   width: 8 },
    { key: 'pSalDia', width: 10 },
    { key: 'pSalHor', width: 10 },
    { key: 'pSalMin', width: 10 },
    { key: 'obs',     width: 24 },
  ];

  // ── Filas 1-3: Encabezado institucional ──
  ws.mergeCells('A1:R1');
  const celdaTitulo = ws.getCell('A1');
  celdaTitulo.value = 'COMPLEJO EDUCATIVO REPÚBLICA DEL BRASIL';
  celdaTitulo.font  = { name: 'Arial', bold: true, size: 16, color: { argb: BLANCO } };
  celdaTitulo.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
  celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  try {
    const logoPath = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'logo.webp');
    const logoId = wb.addImage({ filename: logoPath, extension: 'png' });
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, br: { col: 1, row: 2 }, editAs: 'oneCell' });
  } catch { /* sin logo */ }

  ws.mergeCells('A2:R2');
  const celdaInfra = ws.getCell('A2');
  celdaInfra.value = 'Infraestructura: 11661';
  celdaInfra.font  = { name: 'Arial', bold: true, size: 12, color: { argb: BLANCO } };
  celdaInfra.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
  celdaInfra.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  ws.mergeCells('A3:R3');
  const celdaSub = ws.getCell('A3');
  celdaSub.value = `Reporte de permisos de personal docente correspondiente al ${mesTitulo}`;
  celdaSub.font  = { name: 'Arial', bold: true, size: 11, color: { argb: MARRON } };
  celdaSub.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMARI } };
  celdaSub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  ws.getRow(4).height = 6;

  // ── Filas 5-6: Encabezados de tabla ──
  const estCabeza = (celda, texto) => {
    celda.value     = texto;
    celda.font      = { name: 'Arial', bold: true, size: 9, color: { argb: BLANCO } };
    celda.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    celda.border    = { 
      top: { style: 'thin', color: { argb: VERDE_CLARO } }, 
      bottom: { style: 'thin', color: { argb: VERDE_CLARO } }, 
      left: { style: 'thin', color: { argb: VERDE_CLARO } }, 
      right: { style: 'thin', color: { argb: VERDE_CLARO } } 
    };
  };

  ws.mergeCells('A5:B5'); estCabeza(ws.getCell('A5'), 'Identificación');
  ws.mergeCells('C5:E5'); estCabeza(ws.getCell('C5'), 'Contratación / Fechas');
  ws.mergeCells('F5:K5'); estCabeza(ws.getCell('F5'), 'Enfermedad con certificado médico (90 días)');
  ws.mergeCells('L5:Q5'); estCabeza(ws.getCell('L5'), 'Motivos personales (5 días)');
  ws.getCell('R5').value = ''; 
  ws.getCell('R5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
  ws.getRow(5).height = 30;

  const sub = (letra, texto) => estCabeza(ws.getCell(`${letra}6`), texto);
  sub('A','NIP/Escalafón'); sub('B','Nombre completo'); sub('C','Tipo contratación');
  sub('D','Inicio'); sub('E','Fin');
  sub('F','Días'); sub('G','Horas'); sub('H','Min.');
  sub('I','Saldo Días'); sub('J','Saldo Hrs'); sub('K','Saldo Min.');
  sub('L','Días'); sub('M','Horas'); sub('N','Min.');
  sub('O','Saldo Días'); sub('P','Saldo Hrs'); sub('Q','Saldo Min.');
  sub('R','Observación');
  ws.getRow(6).height = 30;

  // ── Filas de datos ──
  let filaNum = 7;
  const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-SV', { 
    day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' 
  }) : '';

  for (const [i, p] of permisos.entries()) {
    const saldoReg = await prisma.maestroAno.findUnique({
      where: { maestroId_anoEscolarId: { maestroId: p.maestroId, anoEscolarId } },
    });
    const sEnf  = calcularSaldo('ENFERMEDAD', saldoReg?.enfMinUsados || 0).disponible;
    const sPers = calcularSaldo('PERSONAL',   saldoReg?.persMinUsados || 0).disponible;
    const esPar = i % 2 === 0;
    const fondoDato = { type: 'pattern', pattern: 'solid', fgColor: { argb: esPar ? 'FFF2F8F4' : BLANCO } };

    const fila = ws.getRow(filaNum);
    const estDato = (celda, valor, esNum = false) => {
      celda.value     = valor ?? '';
      celda.font      = { name: 'Arial', size: 9 };
      celda.fill      = fondoDato;
      celda.alignment = { horizontal: esNum ? 'center' : 'left', vertical: 'middle', wrapText: false };
      celda.border    = { 
        bottom: { style: 'hair', color: { argb: 'FFD0E8D8' } }, 
        right: { style: 'hair', color: { argb: 'FFD0E8D8' } } 
      };
    };

    const isEnf  = p.tipo === 'ENFERMEDAD';
    const isPers = p.tipo === 'PERSONAL';

    estDato(fila.getCell('A'), p.maestro.nipEscalafon);
    estDato(fila.getCell('B'), p.maestro.nombreCompleto);
    estDato(fila.getCell('C'), p.maestro.tipoContratacion);
    estDato(fila.getCell('D'), fmtFecha(p.fechaInicio));
    estDato(fila.getCell('E'), fmtFecha(p.fechaFin));
    estDato(fila.getCell('F'), isEnf ? (p.dias || '') : '', true);
    estDato(fila.getCell('G'), isEnf ? (p.horas || '') : '', true);
    estDato(fila.getCell('H'), isEnf ? (p.minutos || '') : '', true);
    estDato(fila.getCell('I'), isEnf ? sEnf.dias : '', true);
    estDato(fila.getCell('J'), isEnf ? sEnf.horas : '', true);
    estDato(fila.getCell('K'), isEnf ? sEnf.minutos : '', true);
    estDato(fila.getCell('L'), isPers ? (p.dias || '') : '', true);
    estDato(fila.getCell('M'), isPers ? (p.horas || '') : '', true);
    estDato(fila.getCell('N'), isPers ? (p.minutos || '') : '', true);
    estDato(fila.getCell('O'), isPers ? sPers.dias : '', true);
    estDato(fila.getCell('P'), isPers ? sPers.horas : '', true);
    estDato(fila.getCell('Q'), isPers ? sPers.minutos : '', true);
    estDato(fila.getCell('R'), p.observacion || '');

    fila.height = 16;
    filaNum++;
  }

  // ── Firma ──
  filaNum += 2;
  ws.getRow(filaNum).getCell('A').value = 'F';
  filaNum++;
  ws.getRow(filaNum).getCell('A').value = 'Nombre: Lic. Francisco Gerber Ramírez Ardona';
  ws.getRow(filaNum).getCell('A').font  = { name: 'Arial', bold: true, size: 10 };
  filaNum++;
  ws.getRow(filaNum).getCell('A').value = 'Director de Centro Educativo';
  ws.getRow(filaNum).getCell('A').font  = { name: 'Arial', size: 10 };

  return wb.xlsx.writeBuffer();
}

module.exports = { generarReporte };