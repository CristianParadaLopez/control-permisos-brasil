import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMaestros } from '../../services/maestrosService';
import api from '../../services/api';

export default function RegistroPermiso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const maestroIdInicial = searchParams.get('maestroId') || '';

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

  useEffect(() => {
    getMaestros().then(lista => {
      setMaestros(lista);
      // Si viene maestroId desde la URL, pre-seleccionar
      if (maestroIdInicial) {
        const m = lista.find(x => x.id === maestroIdInicial);
        if (m) {
          setMaestroSeleccionado(m);
          setBusquedaMaestro(m.nombreCompleto);
        }
      }
    }).finally(() => setCargando(false));
  }, [maestroIdInicial]);

  // Filtrar maestros según búsqueda
  useEffect(() => {
    if (!busquedaMaestro.trim()) {
      setMaestrosFiltrados([]);
      return;
    }
    const q = busquedaMaestro.toLowerCase();
    setMaestrosFiltrados(
      maestros.filter(m =>
        m.nombreCompleto.toLowerCase().includes(q) ||
        m.nipEscalafon.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [busquedaMaestro, maestros]);

  // Calcular días entre fechas automáticamente
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
    if (!form.maestroId) { setError('Debes seleccionar un maestro'); return; }
    if (totalMinutos === 0) { setError('Debes ingresar al menos 1 minuto'); return; }
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
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar permiso');
    } finally {
      setEnviando(false);
    }
  };

  const inputCls = "w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Atrás
        </button>
        <h1 className="text-2xl font-bold text-white">Registrar Permiso</h1>
        <p className="text-slate-400 text-sm mt-0.5">Ingresa los datos del permiso del maestro</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}
        {exito && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">✓ {exito}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Búsqueda de maestro */}
          <div className="relative">
            <label className={labelCls}>Buscar maestro</label>
            {cargando ? (
              <div className="h-10 bg-slate-700 rounded-xl animate-pulse" />
            ) : (
              <>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`${inputCls} pl-10 ${maestroSeleccionado ? 'border-emerald-500' : ''}`}
                    placeholder="Escribe el nombre o NIP del maestro..."
                  />
                  {maestroSeleccionado && (
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Lista desplegable */}
                {mostrarLista && maestrosFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-xl overflow-hidden shadow-xl">
                    {maestrosFiltrados.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => seleccionarMaestro(m)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-600 transition flex items-center gap-3 border-b border-slate-600/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                          <span className="text-blue-400 text-xs font-bold">{m.nombreCompleto.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{m.nombreCompleto}</p>
                          <p className="text-slate-400 text-xs">NIP {m.nipEscalafon} · {m.tipoContratacion}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {maestroSeleccionado && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-emerald-300 text-xs">{maestroSeleccionado.nombreCompleto} — NIP {maestroSeleccionado.nipEscalafon}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className={labelCls}>Tipo de permiso</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ENFERMEDAD', label: 'Por Enfermedad', sub: '90 días con constancia médica', color: 'purple' },
                { value: 'PERSONAL', label: 'Personal', sub: '5 días sin justificación', color: 'cyan' },
              ].map(t => (
                <button key={t.value} type="button" onClick={() => set('tipo', t.value)}
                  className={`p-4 rounded-xl border text-left transition ${form.tipo === t.value
                    ? t.color === 'purple' ? 'border-purple-500 bg-purple-500/10' : 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'}`}>
                  <p className={`font-semibold text-sm ${form.tipo === t.value ? t.color === 'purple' ? 'text-purple-300' : 'text-cyan-300' : 'text-white'}`}>{t.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} required className={inputCls} min={form.fechaInicio} />
            </div>
          </div>

          {/* Tiempo */}
          <div>
            <label className={labelCls}>Duración del permiso</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'dias', label: 'Días', max: 90 },
                { key: 'horas', label: 'Horas', max: 7 },
                { key: 'minutos', label: 'Minutos', max: 59 },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-400 mb-1 text-center">{f.label}</label>
                  <input
                    type="number" min="0" max={f.max}
                    value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    className={`${inputCls} text-center text-lg font-mono`}
                  />
                </div>
              ))}
            </div>
            {totalMinutos > 0 && (
              <div className="mt-3 bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total calculado</span>
                <span className="font-mono text-sm font-semibold text-white">
                  {Math.floor(totalMinutos / (8*60))}d {Math.floor((totalMinutos % (8*60)) / 60)}h {totalMinutos % 60}m
                  <span className="text-slate-400 font-normal ml-1">({totalMinutos} min)</span>
                </span>
              </div>
            )}
          </div>

          {/* Observación */}
          <div>
            <label className={labelCls}>Observación <span className="text-slate-500 font-normal">(opcional)</span></label>
            <textarea
              value={form.observacion} onChange={e => set('observacion', e.target.value)}
              rows={2} className={inputCls}
              placeholder="ej. Gripe, cita médica, diligencia personal..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={enviando || !!exito}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-500/20">
              {enviando ? 'Guardando...' : exito ? '✓ Guardado' : 'Registrar permiso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
