import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPermisos, eliminarPermiso } from '../../services/permisosService';
import { getMaestros } from '../../services/maestrosService';

const C = { verde:'#248842', verdeOscuro:'#1a6b32', verdeClaro:'#e8f5ec', amarillo:'#FAD327', amarilloClaro:'#fef9e0', marron:'#7A3F25', marronClaro:'#f5ebe6', blanco:'#FFFFFF', negro:'#000000', gris:'#f5f5f5', grisMedio:'#e5e5e5', grisTexto:'#666666' };
const LIMITE = 10;

export default function ListaPermisos() {
  const navigate = useNavigate();
  const [permisos, setPermisos]     = useState([]);
  const [maestros, setMaestros]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [pagina, setPagina]         = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Filtros aplicados (se usan para llamar a la API)
  const [filtros, setFiltros] = useState({ maestroId: '', mes: '', tipo: '' });
  // Filtros en el input (antes de aplicar)
  const [draft, setDraft] = useState({ maestroId: '', mes: '', tipo: '' });

  const cargar = useCallback(async (pag = 1, filtrosActuales = filtros) => {
    setCargando(true); setError('');
    try {
      const params = { pagina: pag, limite: LIMITE };
      if (filtrosActuales.maestroId) params.maestroId = filtrosActuales.maestroId;
      if (filtrosActuales.mes)       params.mes       = filtrosActuales.mes;
      if (filtrosActuales.tipo)      params.tipo      = filtrosActuales.tipo;
      const res = await getPermisos(params);
      setPermisos(res.data);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);
      setPagina(pag);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar permisos');
    } finally { setCargando(false); }
  }, [filtros]);

  useEffect(() => {
    getMaestros({ limite: 200 }).then(r => setMaestros(r.data || []));
    cargar(1);
  }, []);

  const aplicar = () => {
    setFiltros(draft);
    cargar(1, draft);
  };

  const limpiar = () => {
    const vacio = { maestroId: '', mes: '', tipo: '' };
    setDraft(vacio); setFiltros(vacio);
    cargar(1, vacio);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este permiso? El saldo será restaurado.')) return;
    setEliminando(id);
    try {
      await eliminarPermiso(id);
      cargar(pagina);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    } finally { setEliminando(null); }
  };

  const fmtFecha = (f) => new Date(f).toLocaleDateString('es-SV', { day:'2-digit', month:'short', year:'numeric', timeZone:'UTC' });
  const fmtDur   = (d,h,m) => [d&&`${d}d`,h&&`${h}h`,m&&`${m}m`].filter(Boolean).join(' ') || '—';
  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#248842] focus:ring-2 focus:ring-[#248842]/30 transition bg-white text-black';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.negro }}>Permisos registrados</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} permiso{total !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => navigate('/permisos/nuevo')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: C.verde }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nuevo permiso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Maestro</label>
            <select value={draft.maestroId} onChange={e => setDraft(d => ({...d, maestroId: e.target.value}))} className={inputCls}>
              <option value="">Todos</option>
              {maestros.map(m => <option key={m.id} value={m.id}>{m.nombreCompleto}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mes</label>
            <input type="month" value={draft.mes} onChange={e => setDraft(d => ({...d, mes: e.target.value}))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
            <select value={draft.tipo} onChange={e => setDraft(d => ({...d, tipo: e.target.value}))} className={inputCls}>
              <option value="">Todos</option>
              <option value="ENFERMEDAD">Enfermedad</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={aplicar} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: C.verde }}>Filtrar</button>
            <button onClick={limpiar} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Limpiar</button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: `${C.verde}40`, borderTopColor: C.verde }}/>
            <p className="text-gray-500 text-sm mt-3">Cargando...</p>
          </div>
        ) : permisos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-500 font-medium">No hay permisos con esos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.verde }}>
                  {['Maestro','Tipo','Fechas','Duración','Observación',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permisos.map((p, idx) => (
                  <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.maestro?.nombreCompleto || '—'}</p>
                      <p className="text-xs text-gray-500">NIP {p.maestro?.nipEscalafon}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${p.tipo === 'ENFERMEDAD' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                        {p.tipo === 'ENFERMEDAD' ? 'Enfermedad' : 'Personal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      <p>{fmtFecha(p.fechaInicio)}</p>
                      {p.fechaFin !== p.fechaInicio && <p className="text-gray-400">al {fmtFecha(p.fechaFin)}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700">{fmtDur(p.dias, p.horas, p.minutos)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{p.observacion || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEliminar(p.id)} disabled={eliminando === p.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-40">
                        {eliminando === p.id
                          ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block"/>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">Página {pagina} de {totalPaginas} · {total} registros</p>
          <div className="flex gap-2">
            <button onClick={() => cargar(pagina - 1)} disabled={pagina === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white disabled:opacity-40 hover:border-[#248842] transition">
              ← Anterior
            </button>
            <button onClick={() => cargar(pagina + 1)} disabled={pagina === totalPaginas}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white disabled:opacity-40 hover:border-[#248842] transition">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}