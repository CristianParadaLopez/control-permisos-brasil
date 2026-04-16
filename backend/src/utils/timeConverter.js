//Constantes para convertir días, horas y minutos a un formato unificado de minutos, y viceversa. También incluye una función para calcular el saldo restante de permisos según el tipo (enfermedad o personal) y los minutos usados.
const MINS_POR_HORA = 60;
const HORAS_POR_DIA = 8;
const MINS_POR_DIA  = HORAS_POR_DIA * MINS_POR_HORA; // 480

// Límites de minutos para cada tipo de permiso
const LIMITES_MIN = {
  ENFERMEDAD: 90 * MINS_POR_DIA,  // 43200
  PERSONAL:    5 * MINS_POR_DIA,  //  2400
};

// Convierte días, horas y minutos a un total de minutos
function toMinutos(dias = 0, horas = 0, minutos = 0) {
  return (dias * MINS_POR_DIA) + (horas * MINS_POR_HORA) + minutos;
}

// Convierte un total de minutos a un formato de días, horas y minutos
function fromMinutos(totalMinutos) {
  const dias    = Math.floor(totalMinutos / MINS_POR_DIA);
  const resto   = totalMinutos % MINS_POR_DIA;
  const horas   = Math.floor(resto / MINS_POR_HORA);
  const minutos = resto % MINS_POR_HORA;
  return { dias, horas, minutos };
}

// Calcula el saldo restante de permisos según el tipo y los minutos usados
function calcularSaldo(tipo, minutosUsados) {
  const limite    = LIMITES_MIN[tipo];
  const restante  = Math.max(0, limite - minutosUsados);
  return {
    disponible:      fromMinutos(restante),
    usado:           fromMinutos(minutosUsados),
    agotado:         restante === 0,
    porcentajeUsado: Math.round((minutosUsados / limite) * 100),
  };
}

// Exporta las funciones y constantes para su uso en otras partes de la aplicación
module.exports = { toMinutos, fromMinutos, calcularSaldo, LIMITES_MIN, MINS_POR_DIA };