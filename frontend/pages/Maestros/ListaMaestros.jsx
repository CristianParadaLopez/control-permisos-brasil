import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMaestros, crearMaestro } from '../../services/maestrosService';

// Paleta institucional
const COLORS = {
  verde: '#248842',
  verdeOscuro: '#1a6b32',
  verdeClaro: '#e8f5ec',
  amarillo: '#FAD327',
  amarilloClaro: '#fef9e0',
  marron: '#7A3F25',
  marronClaro: '#f5ebe6',
  blanco: '#FFFFFF',
  negro: '#000000',
  gris: '#f5f5f5'
};

function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (minutos) partes.push(`${minutos}m`);
  return partes.join(' ') || '0m';
}

function BarraSaldo({ porcentaje, tipo }) {
  const esEnfermedad = tipo === 'ENFERMEDAD';
  const colorBarra = esEnfermedad ? COLORS.verde : COLORS.amarillo;
  const colorTexto = esEnfermedad ? COLORS.verde : COLORS.marron;
  const label = esEnfermedad ? 'Enfermedad (90d)' : 'Personal (5d)';
  const ancho = Math.min(porcentaje, 100);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 font-medium" style={{ color: COLORS.marron }}>
        {label}
      </span>
      <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: COLORS.gris, border: `1px solid ${COLORS.verde}20` }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${ancho}%`,
            backgroundColor: porcentaje > 85 ? COLORS.marron : colorBarra
          }}
        />
      </div>
      <span className="w-8 text-right font-mono font-semibold" style={{ color: porcentaje > 85 ? COLORS.marron : colorTexto }}>
        {porcentaje}%
      </span>
    </div>
  );
}

function ModalNuevoMaestro({ onClose, onCreado }) {
  const [form, setForm] = useState({ nipEscalafon: '', nombreCompleto: '', tipoContratacion: 'Sueldo Base' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [touched, setTouched] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const nuevo = await crearMaestro(form);
      onCreado(nuevo);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear maestro. Verifica los datos e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const inputClasses = (field) => `
    w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 outline-none
    border-2 bg-white text-black placeholder-gray-400
    ${touched[field] && !form[field] ? 'border-red-400' : 'border-gray-200 hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_3px_rgba(36,136,66,0.15)]'}
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        style={{ backgroundColor: COLORS.blanco, border: `2px solid ${COLORS.verde}` }}
      >
        {/* Header del modal */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: COLORS.verde }}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Nuevo Maestro
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:rotate-90 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl p-4 text-sm border-l-4 animate-shake" style={{ backgroundColor: COLORS.marronClaro, borderColor: COLORS.marron, color: COLORS.marron }}>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: COLORS.marron }}>
                NIP / Escalafón <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.nipEscalafon}
                onChange={e => setForm(f => ({ ...f, nipEscalafon: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, nipEscalafon: true }))}
                className={inputClasses('nipEscalafon')}
                placeholder="Ej. 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: COLORS.marron }}>
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.nombreCompleto}
                onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, nombreCompleto: true }))}
                className={inputClasses('nombreCompleto')}
                placeholder="Apellido Apellido, Nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: COLORS.marron }}>
                Tipo de contratación
              </label>
              <div className="relative">
                <select
                  value={form.tipoContratacion}
                  onChange={e => setForm(f => ({ ...f, tipoContratacion: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm border-2 border-gray-200 bg-white text-black outline-none focus:border-[#248842] focus:shadow-[0_0_0_3px_rgba(36,136,66,0.15)] transition-all appearance-none cursor-pointer"
                >
                  <option>Sueldo Base</option>
                  <option>Sobre Sueldo</option>
                  <option>Horas Clase</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-95"
                style={{ backgroundColor: COLORS.gris, color: COLORS.marron }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.verde, boxShadow: '0 4px 14px rgba(36,136,66,0.35)' }}
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </span>
                ) : 'Guardar Maestro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ListaMaestros() {
  const navigate = useNavigate();
  const [maestros, setMaestros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [maestroResaltado, setMaestroResaltado] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getMaestros();
      setMaestros(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = maestros.filter(m =>
    m.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nipEscalafon?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCreado = (nuevo) => {
    setMaestroResaltado(nuevo.id);
    setTimeout(() => setMaestroResaltado(null), 3000);
    cargar();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2" style={{ borderColor: `${COLORS.verde}20` }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: COLORS.verde }}>
            Maestros
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: COLORS.marron }}>
            {maestros.length} docentes registrados en el sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-black transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
          style={{ backgroundColor: COLORS.amarillo, boxShadow: '0 4px 14px rgba(250,211,39,0.35)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo maestro
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 transition-colors" style={{ color: COLORS.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full rounded-xl pl-12 pr-4 py-3.5 text-sm border-2 bg-white text-black placeholder-gray-400 outline-none transition-all duration-200 hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_4px_rgba(36,136,66,0.12)]"
          style={{ borderColor: `${COLORS.verde}30` }}
          placeholder="Buscar por nombre o NIP..."
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#7A3F25] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${COLORS.verde}30`, borderTopColor: COLORS.verde }} />
          <p className="text-sm font-medium animate-pulse" style={{ color: COLORS.marron }}>Cargando docentes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed" style={{ borderColor: `${COLORS.verde}25`, backgroundColor: COLORS.verdeClaro }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.verde}15` }}>
            <svg className="w-8 h-8" style={{ color: COLORS.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-bold text-lg" style={{ color: COLORS.marron }}>
            {busqueda ? 'No se encontraron coincidencias' : 'No hay maestros registrados'}
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.marron, opacity: 0.7 }}>
            {busqueda ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un nuevo docente'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((m, index) => (
            <div
              key={m.id}
              onClick={() => navigate(`/maestros/${m.id}`)}
              className={`
                group relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2
                hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]
                ${maestroResaltado === m.id ? 'animate-pulse' : ''}
              `}
              style={{
                backgroundColor: COLORS.blanco,
                borderColor: maestroResaltado === m.id ? COLORS.amarillo : `${COLORS.verde}20`,
                boxShadow: maestroResaltado === m.id ? `0 0 0 4px ${COLORS.amarillo}40` : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.verde;
                e.currentTarget.style.backgroundColor = COLORS.verdeClaro;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = maestroResaltado === m.id ? COLORS.amarillo : `${COLORS.verde}20`;
                e.currentTarget.style.backgroundColor = COLORS.blanco;
              }}
            >
              {/* Indicador de nuevo */}
              {maestroResaltado === m.id && (
                <span className="absolute -top-2 -right-2 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-black shadow-md" style={{ backgroundColor: COLORS.amarillo }}>
                  Nuevo
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                {/* Info principal */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-black shadow-sm transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${COLORS.verde}15`,
                      color: COLORS.verde,
                      border: `2px solid ${COLORS.verde}30`
                    }}
                  >
                    {m.nombreCompleto?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-base truncate transition-colors group-hover:text-[#248842]" style={{ color: COLORS.negro }}>
                      {m.nombreCompleto}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: COLORS.amarilloClaro, color: COLORS.marron }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        NIP {m.nipEscalafon}
                      </span>
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: `${COLORS.marron}40` }} />
                      <span className="text-xs font-medium" style={{ color: COLORS.marron }}>
                        {m.tipoContratacion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Saldo rápido */}
                {m.saldo && (
                  <div className="hidden sm:block shrink-0 w-56 space-y-2 p-3 rounded-xl" style={{ backgroundColor: `${COLORS.verde}08` }}>
                    <BarraSaldo porcentaje={m.saldo.enfermedad?.porcentajeUsado || 0} tipo="ENFERMEDAD" />
                    <BarraSaldo porcentaje={m.saldo.personal?.porcentajeUsado || 0} tipo="PERSONAL" />
                  </div>
                )}

                {/* Flecha */}
                <div className="shrink-0 self-center w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-1" style={{ backgroundColor: `${COLORS.verde}10` }}>
                  <svg className="w-4 h-4 transition-colors" style={{ color: COLORS.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalNuevoMaestro
          onClose={() => setShowModal(false)}
          onCreado={handleCreado}
        />
      )}

      {/* Estilos de animación inline */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}