import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPermisos, eliminarPermiso } from '../../services/permisosService';
import { getMaestros } from '../../services/maestrosService';

export default function ListaPermisos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [permisos, setPermisos] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);

  // Filtros
  const [filtroMaestro, setFiltroMaestro] = useState(searchParams.get('maestroId') || '');
  const [filtroMes, setFiltroMes] = useState(searchParams.get('mes') || '');
  const [filtroTipo, setFiltroTipo] = useState(searchParams.get('tipo') || '');

  useEffect(() => {
    cargarDatos();
  }, [filtroMaestro, filtroMes, filtroTipo]);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [listaPermisos, listaMaestros] = await Promise.all([
        getPermisos({
          ...(filtroMaestro && { maestroId: filtroMaestro }),
          ...(filtroMes && { mes: filtroMes }),
        }),
        getMaestros(),
      ]);
      setPermisos(listaPermisos);
      setMaestros(listaMaestros);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar permisos');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este permiso?')) return;
    setEliminando(id);
    try {
      await eliminarPermiso(id);
      setPermisos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const aplicarFiltros = () => {
    const params = {};
    if (filtroMaestro) params.maestroId = filtroMaestro;
    if (filtroMes) params.mes = filtroMes;
    if (filtroTipo) params.tipo = filtroTipo;
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    setFiltroMaestro('');
    setFiltroMes('');
    setFiltroTipo('');
    setSearchParams({});
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearDuracion = (dias, horas, minutos) => {
    const partes = [];
    if (dias > 0) partes.push(`${dias}d`);
    if (horas > 0) partes.push(`${horas}h`);
    if (minutos > 0) partes.push(`${minutos}m`);
    return partes.join(' ') || '—';
  };

  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#248842] focus:ring-2 focus:ring-[#248842]/30 transition bg-white";
  const btnPrimario = "bg-[#248842] hover:bg-[#1f6f36] text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md";
  const btnSecundario = "bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#000000]">Permisos registrados</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {permisos.length} permiso{permisos.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button
          onClick={() => navigate('/permisos/nuevo')}
          className={btnPrimario + " flex items-center gap-2"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo permiso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Maestro */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Maestro</label>
            <select
              value={filtroMaestro}
              onChange={e => setFiltroMaestro(e.target.value)}
              className={inputCls}
            >
              <option value="">Todos los maestros</option>
              {maestros.map(m => (
                <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
            <input
              type="month"
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className={inputCls}
            >
              <option value="">Todos</option>
              <option value="ENFERMEDAD">Enfermedad</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex items-end gap-2">
            <button onClick={aplicarFiltros} className={btnPrimario + " flex-1"}>
              Filtrar
            </button>
            <button onClick={limpiarFiltros} className={btnSecundario}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-[#248842] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 text-sm mt-3">Cargando permisos...</p>
          </div>
        ) : permisos.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No hay permisos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Usa el botón "Nuevo permiso" para agregar uno</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#248842] text-white">
                  <th className="text-left px-4 py-3 font-semibold">Maestro</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold">Fechas</th>
                  <th className="text-left px-4 py-3 font-semibold">Duración</th>
                  <th className="text-left px-4 py-3 font-semibold">Observación</th>
                  <th className="text-center px-4 py-3 font-semibold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permisos
                  .filter(p => !filtroTipo || p.tipo === filtroTipo)
                  .map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#248842]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#248842] text-xs font-bold">
                            {p.maestro?.nombreCompleto?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.maestro?.nombreCompleto || '—'}</p>
                          <p className="text-xs text-gray-500">NIP {p.maestro?.nipEscalafon || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        p.tipo === 'ENFERMEDAD'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {p.tipo === 'ENFERMEDAD' ? 'Enfermedad' : 'Personal'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        <p>{formatearFecha(p.fechaInicio)}</p>
                        {p.fechaFin !== p.fechaInicio && (
                          <p className="text-xs text-gray-500">al {formatearFecha(p.fechaFin)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700 font-medium">
                        {formatearDuracion(p.dias, p.horas, p.minutos)}
                      </span>
                      <p className="text-xs text-gray-400">{p.totalMinutos} min</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 text-sm max-w-xs truncate">
                        {p.observacion || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEliminar(p.id)}
                        disabled={eliminando === p.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-50"
                        title="Eliminar permiso"
                      >
                        {eliminando === p.id ? (
                          <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}