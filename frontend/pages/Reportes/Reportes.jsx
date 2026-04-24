import { useState, useEffect } from 'react';
import api from '../../services/api';

function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const p = [];
  if (dias) p.push(`${dias}d`);
  if (horas) p.push(`${horas}h`);
  if (minutos) p.push(`${minutos}m`);
  return p.join(' ') || '0m';
}

export default function Reportes() {
  const [resumen, setResumen] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [anoId, setAnoId] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: ano } = await api.get('/reportes/ano-activo');
        setAnoId(ano.id);
        const { data } = await api.get('/reportes/resumen', { params: { anoEscolarId: ano.id } });
        setResumen(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res = await api.get('/reportes/excel', {
        params: { anoEscolarId: anoId },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `permisos_brasil_${new Date().getFullYear()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const filtrados = resumen.filter(r =>
    r.maestro?.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.maestro?.nipEscalafon?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resumen de permisos — Ciclo 2026</p>
        </div>
        <button onClick={handleExportar} disabled={exportando || !anoId}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exportando ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
          placeholder="Buscar maestro..." />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <p>No hay permisos registrados aún</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Maestro</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">NIP</th>
                  <th className="text-center text-xs font-semibold text-purple-400 uppercase tracking-wider px-4 py-3">Enfermedad</th>
                  <th className="text-center text-xs font-semibold text-cyan-400 uppercase tracking-wider px-4 py-3">Personal</th>
                  <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtrados.map((r, i) => {
                  const enf = r.enfermedad;
                  const pers = r.personal;
                  const critico = enf?.porcentajeUsado > 80 || pers?.porcentajeUsado > 80;
                  return (
                    <tr key={i} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 text-white font-medium">{r.maestro?.nombreCompleto || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden sm:table-cell">{r.maestro?.nipEscalafon}</td>
                      <td className="px-4 py-3 text-center">
                        {enf ? (
                          <div>
                            <p className="font-mono text-purple-300 text-xs font-semibold">{fmtTiempo(enf.usado)}</p>
                            <p className="text-slate-500 text-xs">{enf.porcentajeUsado}% usado</p>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pers ? (
                          <div>
                            <p className="font-mono text-cyan-300 text-xs font-semibold">{fmtTiempo(pers.usado)}</p>
                            <p className="text-slate-500 text-xs">{pers.porcentajeUsado}% usado</p>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${critico ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {critico ? 'Crítico' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
