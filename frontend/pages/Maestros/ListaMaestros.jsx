import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMaestros, crearMaestro } from '../../services/maestrosService';

// Convierte minutos a "Xd Yh Zm"
function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (minutos) partes.push(`${minutos}m`);
  return partes.join(' ') || '0m';
}

function BarraSaldo({ porcentaje, tipo }) {
  const color = porcentaje > 80 ? 'bg-red-500' : porcentaje > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  const label = tipo === 'ENFERMEDAD' ? 'Enfermedad (90d)' : 'Personal (5d)';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
      </div>
      <span className={`w-8 text-right font-mono ${porcentaje > 80 ? 'text-red-400' : 'text-slate-400'}`}>{porcentaje}%</span>
    </div>
  );
}

function ModalNuevoMaestro({ onClose, onCreado }) {
  const [form, setForm] = useState({ nipEscalafon: '', nombreCompleto: '', tipoContratacion: 'Sueldo Base' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const nuevo = await crearMaestro(form);
      onCreado(nuevo);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear maestro');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Nuevo Maestro</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">NIP / Escalafón</label>
            <input required value={form.nipEscalafon} onChange={e => setForm(f => ({...f, nipEscalafon: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              placeholder="ej. 12345" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nombre completo</label>
            <input required value={form.nombreCompleto} onChange={e => setForm(f => ({...f, nombreCompleto: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              placeholder="Apellido Apellido, Nombre" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tipo de contratación</label>
            <select value={form.tipoContratacion} onChange={e => setForm(f => ({...f, tipoContratacion: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition">
              <option>Sueldo Base</option>
              <option>Sobre Sueldo</option>
              <option>Horas Clase</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
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
    m.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nipEscalafon.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Maestros</h1>
          <p className="text-slate-400 text-sm mt-0.5">{maestros.length} docentes registrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo maestro
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
          placeholder="Buscar por nombre o NIP..."
        />
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>No se encontraron maestros</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(m => (
            <div key={m.id}
              onClick={() => navigate(`/maestros/${m.id}`)}
              className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 cursor-pointer transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                {/* Info principal */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 font-bold text-sm">{m.nombreCompleto.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-blue-300 transition">{m.nombreCompleto}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">NIP {m.nipEscalafon}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                      <span className="text-xs text-slate-400">{m.tipoContratacion}</span>
                    </div>
                  </div>
                </div>
                {/* Saldo rápido si viene con datos */}
                {m.saldo && (
                  <div className="hidden sm:block shrink-0 w-52 space-y-1.5">
                    <BarraSaldo porcentaje={m.saldo.enfermedad.porcentajeUsado} tipo="ENFERMEDAD" />
                    <BarraSaldo porcentaje={m.saldo.personal.porcentajeUsado} tipo="PERSONAL" />
                  </div>
                )}
                <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalNuevoMaestro
          onClose={() => setShowModal(false)}
          onCreado={() => cargar()}
        />
      )}
    </div>
  );
}
