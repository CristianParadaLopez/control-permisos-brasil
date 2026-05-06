import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMaestros } from '../../services/maestrosService';
import api from '../../services/api';

const C = {
  verde: '#248842',
  verdeOscuro: '#1a6b32',
  verdeClaro: '#e8f5ec',
  amarillo: '#FAD327',
  amarilloClaro: '#fef9e0',
  marron: '#7A3F25',
  marronClaro: '#f5ebe6',
  blanco: '#FFFFFF',
  negro: '#000000',
  gris: '#f5f5f5',
  grisMedio: '#e5e5e5',
};

export default function RegistroPermiso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const maestroIdInicial = searchParams.get('maestroId') || '';
  const dropdownRef = useRef(null);

  const [maestros, setMaestros] = useState([]);
  const [maestrosFiltrados, setMaestrosFiltrados] = useState([]);
  const [busquedaMaestro, setBusquedaMaestro] = useState('');
  const [maestroSeleccionado, setMaestroSeleccionado] = useState(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [form, setForm] = useState({
    maestroId: maestroIdInicial,
    tipo: 'ENFERMEDAD',
    fechaInicio: '',
    fechaFin: '',
    dias: 0,
    horas: 0,
    minutos: 0,
    observacion: '',
  });

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarLista(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getMaestros().then(lista => {
      setMaestros(lista);
      if (maestroIdInicial) {
        const m = lista.find(x => x.id === maestroIdInicial);
        if (m) {
          setMaestroSeleccionado(m);
          setBusquedaMaestro(m.nombreCompleto);
        }
      }
    }).finally(() => setCargando(false));
  }, [maestroIdInicial]);

  useEffect(() => {
    if (!busquedaMaestro.trim()) {
      setMaestrosFiltrados([]);
      return;
    }
    const q = busquedaMaestro.toLowerCase();
    setMaestrosFiltrados(
      maestros.filter(m =>
        m.nombreCompleto?.toLowerCase().includes(q) ||
        m.nipEscalafon?.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [busquedaMaestro, maestros]);

  useEffect(() => {
    if (form.fechaInicio && form.fechaFin) {
      const inicio = new Date(form.fechaInicio);
      const fin = new Date(form.fechaFin);
      if (fin >= inicio) {
        const diff = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
        setForm(f => ({ ...f, dias: diff }));
      }
    }
  }, [form.fechaInicio, form.fechaFin]);

  const seleccionarMaestro = (m) => {
    setMaestroSeleccionado(m);
    setBusquedaMaestro(m.nombreCompleto);
    setForm(f => ({ ...f, maestroId: m.id }));
    setMostrarLista(false);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const totalMinutos = (Number(form.dias) * 8 * 60) + (Number(form.horas) * 60) + Number(form.minutos);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    if (!form.maestroId) { setError('Debes seleccionar un maestro'); return; }
    if (totalMinutos === 0) { setError('Debes ingresar al menos 1 minuto de permiso'); return; }
    setEnviando(true);
    try {
      const { data: ano } = await api.get('/reportes/ano-activo');
      await api.post('/permisos', {
        ...form,
        anoEscolarId: ano.id,
        dias: Number(form.dias),
        horas: Number(form.horas),
        minutos: Number(form.minutos),
      });
      setExito('Permiso registrado correctamente');
      setTimeout(() => {
        if (maestroIdInicial) navigate(`/maestros/${maestroIdInicial}`);
        else navigate('/maestros');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el permiso. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm border-2 bg-white text-black placeholder-gray-400 outline-none transition-all duration-200 hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_4px_rgba(36,136,66,0.12)]";
  const labelCls = "block text-sm font-bold mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 transition-colors hover:underline"
          style={{ color: C.marron }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: C.verde }}>
          Registrar Permiso
        </h1>
        <p className="text-sm mt-1 font-medium" style={{ color: C.marron }}>
          Ingresa los datos del permiso del docente
        </p>
      </div>

      {/* Card principal */}
      <div className="rounded-2xl border-2 p-6 space-y-5 shadow-sm" style={{ backgroundColor: C.blanco, borderColor: `${C.verde}20` }}>
        {error && (
          <div className="rounded-xl p-4 text-sm border-l-4 animate-shake" style={{ backgroundColor: C.marronClaro, borderColor: C.marron, color: C.marron }}>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {exito && (
          <div className="rounded-xl p-4 text-sm border-l-4 animate-fadeIn" style={{ backgroundColor: C.verdeClaro, borderColor: C.verde, color: C.verdeOscuro }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-bold">{exito}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Búsqueda de maestro */}
          <div className="relative" ref={dropdownRef}>
            <label className={labelCls} style={{ color: C.marron }}>Buscar maestro <span className="text-red-500">*</span></label>
            {cargando ? (
              <div className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: C.gris }} />
            ) : (
              <>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={busquedaMaestro}
                    onChange={e => {
                      setBusquedaMaestro(e.target.value);
                      setMaestroSeleccionado(null);
                      setForm(f => ({ ...f, maestroId: '' }));
                      setMostrarLista(true);
                    }}
                    onFocus={() => setMostrarLista(true)}
                    className={`${inputCls} pl-11 ${maestroSeleccionado ? 'border-[#248842]' : 'border-gray-200'}`}
                    placeholder="Escribe el nombre o NIP del maestro..."
                    autoComplete="off"
                  />
                  {maestroSeleccionado && (
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Lista desplegable */}
                {mostrarLista && maestrosFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden shadow-xl border-2 animate-slideDown" style={{ backgroundColor: C.blanco, borderColor: `${C.verde}30` }}>
                    {maestrosFiltrados.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => seleccionarMaestro(m)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-150 hover:pl-5"
                        style={{
                          borderBottom: idx < maestrosFiltrados.length - 1 ? `1px solid ${C.grisMedio}` : 'none',
                          backgroundColor: C.blanco
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.verdeClaro; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.blanco; }}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm" style={{ backgroundColor: `${C.verde}15`, color: C.verde }}>
                          {m.nombreCompleto?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: C.negro }}>{m.nombreCompleto}</p>
                          <p className="text-xs font-medium" style={{ color: C.marron }}>NIP {m.nipEscalafon} · {m.tipoContratacion}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {maestroSeleccionado && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ backgroundColor: C.verdeClaro, borderColor: `${C.verde}30` }}>
                    <svg className="w-5 h-5 shrink-0" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-bold" style={{ color: C.verdeOscuro }}>
                      {maestroSeleccionado.nombreCompleto} — NIP {maestroSeleccionado.nipEscalafon}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tipo de permiso */}
          <div>
            <label className={labelCls} style={{ color: C.marron }}>Tipo de permiso</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ENFERMEDAD', label: 'Por Enfermedad', sub: '90 días con constancia médica', esVerde: true },
                { value: 'PERSONAL', label: 'Personal', sub: '5 días sin justificación', esVerde: false },
              ].map(t => {
                const activo = form.tipo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('tipo', t.value)}
                    className="relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      backgroundColor: activo ? (t.esVerde ? C.verdeClaro : C.amarilloClaro) : C.blanco,
                      borderColor: activo ? (t.esVerde ? C.verde : C.amarillo) : C.grisMedio,
                      boxShadow: activo ? `0 4px 12px ${t.esVerde ? 'rgba(36,136,66,0.15)' : 'rgba(250,211,39,0.25)'}` : 'none'
                    }}
                  >
                    {activo && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: t.esVerde ? C.verde : C.amarillo }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={t.esVerde ? C.blanco : C.negro} strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <p className="font-bold text-sm" style={{ color: activo ? (t.esVerde ? C.verdeOscuro : C.marron) : C.negro }}>
                      {t.label}
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: C.marron, opacity: 0.8 }}>{t.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ color: C.marron }}>Fecha inicio <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={e => set('fechaInicio', e.target.value)}
                required
                className={inputCls}
                style={{ borderColor: form.fechaInicio ? `${C.verde}50` : '#e5e5e5', colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: C.marron }}>Fecha fin <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={e => set('fechaFin', e.target.value)}
                required
                min={form.fechaInicio}
                className={inputCls}
                style={{ borderColor: form.fechaFin ? `${C.verde}50` : '#e5e5e5', colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className={labelCls} style={{ color: C.marron }}>Duración del permiso</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'dias', label: 'Días', max: 90 },
                { key: 'horas', label: 'Horas', max: 7 },
                { key: 'minutos', label: 'Minutos', max: 59 },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold mb-1.5 text-center uppercase tracking-wide" style={{ color: C.marron }}>{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    max={f.max}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    className={`${inputCls} text-center text-lg font-mono font-bold`}
                    style={{ borderColor: '#e5e5e5' }}
                  />
                </div>
              ))}
            </div>
            {totalMinutos > 0 && (
              <div className="mt-3 rounded-xl p-4 flex items-center justify-between border" style={{ backgroundColor: C.verdeClaro, borderColor: `${C.verde}25` }}>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.verdeOscuro }}>Total calculado</span>
                <span className="font-mono text-sm font-bold" style={{ color: C.verdeOscuro }}>
                  {Math.floor(totalMinutos / (8 * 60))}d {Math.floor((totalMinutos % (8 * 60)) / 60)}h {totalMinutos % 60}m
                  <span className="font-normal ml-1.5 opacity-70">({totalMinutos} min)</span>
                </span>
              </div>
            )}
          </div>

          {/* Observación */}
          <div>
            <label className={labelCls} style={{ color: C.marron }}>
              Observación <span className="font-normal opacity-60">(opcional)</span>
            </label>
            <textarea
              value={form.observacion}
              onChange={e => set('observacion', e.target.value)}
              rows={3}
              className={inputCls}
              style={{ borderColor: '#e5e5e5', resize: 'vertical' }}
              placeholder="Ej. Gripe, cita médica, diligencia personal..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-95"
              style={{ backgroundColor: C.gris, color: C.marron }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !!exito}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              style={{
                backgroundColor: C.verde,
                boxShadow: '0 4px 14px rgba(36,136,66,0.35)'
              }}
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </span>
              ) : exito ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Guardado
                </span>
              ) : (
                'Registrar permiso'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}