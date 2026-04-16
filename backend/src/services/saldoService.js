const { PrismaClient } = require('@prisma/client');
const { toMinutos, calcularSaldo } = require('../utils/timeConverter');
const prisma = require('../lib/prisma');

// Función para obtener el saldo actual de permisos de un maestro para un año escolar específico. Si no existe un registro, lo crea con saldo 0.
async function obtenerSaldo(maestroId, anoEscolarId) {
  let registro = await prisma.maestroAno.findUnique({
    where: { maestroId_anoEscolarId: { maestroId, anoEscolarId } },
  });
  // Si no existe el registro lo crea con saldo 0
  if (!registro) {
    registro = await prisma.maestroAno.create({
      data: { maestroId, anoEscolarId },
    });
  }
  return {
    enfermedad: calcularSaldo('ENFERMEDAD', registro.enfMinUsados),
    personal:   calcularSaldo('PERSONAL',   registro.persMinUsados),
  };
}

// Función para descontar minutos del saldo de permisos de un maestro. Verifica que no se exceda el límite permitido y, si es así, revierte la operación y lanza un error.
async function descontarSaldo(maestroId, anoEscolarId, tipo, dias, horas, minutos) {
  const totalMin = toMinutos(dias, horas, minutos);
  const campo    = tipo === 'ENFERMEDAD' ? 'enfMinUsados' : 'persMinUsados';

  const registro = await prisma.maestroAno.upsert({
    where:  { maestroId_anoEscolarId: { maestroId, anoEscolarId } },
    create: { maestroId, anoEscolarId, [campo]: totalMin },
    update: { [campo]: { increment: totalMin } },
  });

  // Verificar que no se excedió el límite
  const saldo = calcularSaldo(tipo, registro[campo]);
  if (saldo.porcentajeUsado > 100) {
    // Revertir — descontar lo que acabamos de sumar
    await prisma.maestroAno.update({
      where:  { maestroId_anoEscolarId: { maestroId, anoEscolarId } },
      data:   { [campo]: { decrement: totalMin } },
    });
    throw new Error(`Saldo insuficiente. Solo quedan ${saldo.disponible.dias}d ${saldo.disponible.horas}h ${saldo.disponible.minutos}min`);
  }
  return saldo;
}

module.exports = { obtenerSaldo, descontarSaldo };